
/**
* The status of a work item.
*/
ItemStatus = {
  ToDo: "To Do",
  InProgress: "In Progress",
  Done: "Done",
  OnHold: "On Hold",
  Abandoned: "Abandoned"
}

Object.freeze(ItemStatus);



/**
* Called to create a new work item.
*/
function WorkItem(project, file, parentFolder, folder, status) {
  this._project = project;
  this._file = file;
  this._parentFolder = parentFolder;
  this._folder = folder;
  this._name = undefined;
  this._assignedTo = undefined;
  this._info = undefined;
  this._workType = WorkType.Development;
  
  this._status = status;
  
  this._deliverable = '';
  
  if (parentFolder != null)
    this._deliverable = folder.getName();
  
  Object.defineProperties(this, {
    
    /**
    * 
    */
    id: {
      get: function() {
        return this._file.getId();
      },
      enumerable: true,
      configurable: false
    },
    
    /**
    * 
    */
    url: {
      get: function() {
        return this._file.getUrl();
      },
      enumerable: true,
      configurable: false
    },
    
    /**
    * Gets the name of the work item.
    */
    name: {
      get: function() {
        if (this._name == undefined) {
          var fullname = this._file.getName();
          
          var pos = fullname.lastIndexOf(':');
          
          if (pos > -1)
            this._name = fullname.slice(pos + 1).trim();
        }
        return this._name;
      },
      enumerable: true,
      configurable: false
    },
    
    /**
    * 
    */
    type: {
      get: function() {
        return this._workType;
      },
      enumerable: true,
      configurable: false
    },
    
    /**
    * 
    */
    project: {
      get: function() {
        return this._project;
      },
      enumerable: true,
      configurable: false
    },
    
    /**
    * Gets the file that represents the work item.
    */
    file: {
      get: function() {
        return this._file;
      },
      enumerable: false,
      configurable: false
    },
    
    /**
    * Gets the name of the deliverable to which the work item belongs.
    */
    deliverable: {
      get: function() {
        if (this.status != ItemStatus.ToDo) {
          var item = this.getInfo()[InfoName.Deliverable];
          
          if (item != undefined) {
            this._deliverable = item.value;
          }
        }
        
        return isNullOrEmpty(this._deliverable) ? "unallocated" : this._deliverable;
      },
      enumerable: true,
      configurable: false
    },
    
    /**
    * Gets the status of the work item.
    */
    status: {
      get: function() {
        return this._status;
      },
      enumerable: true,
      configurable: false
    },
    
    /**
    * Gets the name of the resource to which the work item is assigned.
    */
    assignedTo: {
      get: function() {
        if (this._assignedTo == undefined) {
          this._assignedTo = 'unassigned';
          
          var name = this._file.getName();
          
          var found = /(?!\d)[A-Z]+:/i.exec(name);
          
          if (found != null) {
            var resource = found[0].slice(0,-1);
            
            if (isValidResource(resource))
              this._assignedTo = resource;
          }
        }
        
        return this._assignedTo;
      },
      enumerable: true,
      configurable: false
    },
    
    /**
    * Gets or sets extended information about the work item.
    */
    info: {
      get: function() {
        return this._info;
      },
      set: function(value) {
        this._info = value;
      },
      enumerable: true,
      configurable: false
    }
  });
}



WorkItem.prototype = {
  constructor: WorkItem,
  
  
  /**
  * Called to get a value indicating whether the work item is a bug.
  */
  isBug: function() {
    return /bug:/i.test(this._file.getName());
  },
  
  
  /**
  * Called to get a value indicating whether the work item is testing work.
  */
  isTesting: function() {
    return /test:/i.test(this._file.getName());
  },
  
  
  /**
  * Called to get a value indicating whether the work item is research work.
  */
  isResearch: function() {
    return /research:/i.test(this._file.getName());
  },
  
  
  /**
  * 
  */
  getDateCreated: function() {
    return this._file.getDateCreated();
  },
  
  
  /**
  * Called to get extended information about the work item.
  */
  getInfo: function(overwrite) {
    if (this.info == undefined || overwrite == true) {
      
      var doc = DocumentApp.openById(this._file.getId());
      
      var body = doc.getBody();
      
      this.info = new WorkItemInfoReader().readBody(body);
    }
    
    return this.info;
  },
  
  
  /**
  * 
  */
  update: function(updateInfo) {
    var doc = DocumentApp.openById(this._file.getId());
    
    var body = doc.getBody();
    var reader = new WorkItemInfoReader();
    
    this.info = reader.readBody(body);
    
    var before = takeSnapshot(this);
    
    if (updateInfo == undefined) {
      switch (this.status) {
        case ItemStatus.ToDo:
          updateInfo = getToDoUpdates(this, doc, body);
          break;
        case ItemStatus.InProgress:
          updateInfo = getInProgressUpdates(this, doc, body);
          break;
        case ItemStatus.Done:
          updateInfo = getDoneUpdates(this, doc, body);
          break;
        case ItemStatus.OnHold:
          updateInfo = getOnHoldUpdates(this, doc, body);
          break;
        case ItemStatus.Abandoned:
          updateInfo = getAbandonedUpdates(this, doc, body);
          break;
      }
    }
    
    if (updateInfo != null) {
      if (applyUpdates(this, body, updateInfo) > 0) {
        this.info = reader.readBody(body);
        
        doc.saveAndClose();
      }
    }
    
    var after = takeSnapshot(this);
    
    var id = this.id;
    
    this._project.trackMulti(id, before, after);
    
    return this.info;
  },
  
  
  /**
  * Gets the estimate as a floating point value from the work item's info.
  */
  getEstimate: function() {
    var info = this.getInfo();
    
    var estimate = parseFloat(info[InfoName.AdjustedEstimate]);
    
    if (isNaN(estimate)) {
      estimate = parseFloat(info[InfoName.Estimate]);
    }
    
    return estimate;
  },
  
  
  /**
  * 
  */
  getTotalWork: function() {
    var info = this.getInfo();
    
    var totalWork = parseFloat(info[InfoName.TotalWork]);
    
    return totalWork;
  },
  
  
  /**
  * 
  */
  getWorkRemaining: function() {
    var remaining = this.getEstimate();
    
    var totalWork = this.getTotalWork();
    
    if (!isNaN(totalWork)) {
      remaining -= totalWork;
    }
    
    return remaining;
  },
  
  
  /**
  * Gets the level of confidence as a floating point value from the work item's info.
  */
  getConfidence: function() {
    var info = this.getInfo();
    
    var confidence = parseFloat(info[InfoName.Confidence]);
    
    return confidence;
  },
  
  /**
  * 
  */
  getFlag: function() {
    var info = this.getInfo();
    
    var flag = (info[InfoName.Flag] != undefined) ? info[InfoName.Flag].value : '';
    
    return flag;
  },
  
  /**
  *
  */
  getDateCompleted: function() {
    var completed;
    
    var info = this.getInfo();
    
    if (info[InfoName.DateCompleted] != undefined) {
      completed = new Date(info[InfoName.DateCompleted].value);
    }
    
    return completed;
  },
  
  /**
  * 
  */
  getDateStarted: function() {
    var started;
    
    var info = this.getInfo();
    
    if (info[InfoName.DateStarted] != undefined) {
      started = new Date(info[InfoName.DateStarted].value);
    }
    
    return started;
  },
  
  /**
  * 
  */
  getStartDate: function() {
    var start;
    
    var info = this.getInfo();
    
    if (info[InfoName.StartDate] != undefined) {
      start = new Date(info[InfoName.StartDate].value);
    }
    
    return start;
  },
  
  /**
  * 
  */
  getDueDate: function() {
    var due;
    
    var info = this.getInfo();
    
    if (info[InfoName.DueDate] != undefined) {
      due = new Date(info[InfoName.DueDate].value);
    }
    
    return due;
  },
  
  /**
  * 
  */
  getParagraphs: function(count) {
    if (count == undefined) {
      count = 5;
    }
    
    var paras = [];
    var wasPrevBlank = true;
    
    var info = this.getInfo();
    var content = info[InfoName.Content];
    
    if (content.length > 0) {
      var prevIndex = content[0].index - 1;
      
      for (var i = 0; i < content.length && paras.length < count; i++) {
        var p = content[i].paragraph;
        
        var diff = content[i].index - prevIndex;
        
        if (diff != 1) {
          paras = [];
        }
        
        var text = content[i].text;
        var isBlank = isEmptyOrWhitespace(text);
        
        if (!isBlank || !wasPrevBlank) {
          paras.push(p.copy());
        
          wasPrevBlank = isBlank;
        }
        
        prevIndex = content[i].index;
      }
    }
    
    return paras;
  }
}


/**
* 
*/
function takeSnapshot(workitem) {
  var snapshot = {
    estimate: workitem.getEstimate() || 0,
    totalWork: workitem.getTotalWork() || 0,
    flag: workitem.getFlag() || '',
    assignedTo: workitem.assignedTo || '',
    status: workitem.status || '',
    deliverable: workitem.deliverable || '',
    startDate: workitem.getStartDate() || '',
    dueDate: workitem.getDueDate() || '',
    dateStarted: workitem.getDateStarted() || '',
    dateCompleted: workitem.getDateCompleted() || ''
  };
  
  return snapshot;
}


/**
* Called to insert extended information updates into the specified document body.
*/
function applyUpdates(workitem, body, updateInfo) {
  var updateCount = 0;
  var paragraphs = body.getParagraphs();
  
  for (var name in updateInfo) {
    if (updateInfo[name].value != undefined) {
      var item = updateInfo[name];
      
      if (workitem.info[name] == undefined)
        var p = body.insertParagraph(0, '');
      else
        var p = paragraphs[workitem.info[name].index];
      
      var text = p.editAsText();
      text.setText(item.label + item.value);
      
      var labelStyle = {};
      labelStyle[DocumentApp.Attribute.FOREGROUND_COLOR] = '#4a86e8';
      
      text.setAttributes(0, item.label.length - 2, labelStyle);
      
      updateCount++;
    }
  }
  
  return updateCount;
}



/**
* Called to update a work item with a status of 'to do'.
*/
function getToDoUpdates(workitem, doc, body) {
  var oldval;
  var curval;
  
  var updates = getEstimateUpdates(workitem, doc, body);
  
  if (workitem.info[InfoName.Confidence] == undefined) {
    updates[InfoName.Confidence].value = '';
  }
  
  if (workitem.info[InfoName.TotalWork] == undefined) {
    updates[InfoName.TotalWork].value = '';
  }
  
  if (workitem.info[InfoName.Module] == undefined) {
    updates[InfoName.Module].value = '';
  }
  
  if (workitem.info[InfoName.Feature] == undefined) {
    updates[InfoName.Feature].value = '';
  }
  
  if (workitem.info[InfoName.Platform] == undefined) {
    updates[InfoName.Platform].value = '( Windows | .NET | VB6 | Uniface | Synergy | VBA | Office | Web | VMS | Other | n/a )';
  }
  
  oldval = workitem.info[InfoName.Deliverable];
  curval = workitem.deliverable;
  
  if (!isNullOrEmpty(curval) &&
      oldval != curval) {
    
    updates[InfoName.Deliverable].value = workitem.deliverable;
  }
  
  return updates;
}

/**
* Called to update a work item with a status of 'in progress'.
*/
function getInProgressUpdates(workitem, doc, body) {
  
  var updates = getEstimateUpdates(workitem, doc, body);
  
  if (workitem.info[InfoName.TotalWork] == undefined) {
    updates[InfoName.TotalWork].value = '';
  }
  
  if (workitem.info[InfoName.DateStarted] == undefined) {
    updates[InfoName.DateStarted].value = new Date().toDateString();
  }
  
  if (workitem.info[InfoName.Flag] == undefined) {
    updates[InfoName.Flag].value = 'Green';
  }
  
  return updates;
}

/**
* Called to update a work item with a status of 'done'.
* 
* Date Completed:
* 
* This routine sets this work item information if it's not already set. 
* If the document hasn't been modified for over 30 days then the
* routine makes an assumption that no further work has been done during
* this period and uses the 'modified date' as the 'date completed'.
* If the document has been modified recently (over the past two weeks)
* then this routine assumes that the work item has only just been finished
* and thus sets the 'date completed' to today's date.
* 
* n.b. The logic above is a crude (and flawed) approximation due to the
* fact that this routine might not have been run on the work items in a
* 'done' folder before, or the user may not have moved the work item into 
* the 'done' folder immediately after completion.
*/
function getDoneUpdates(workitem, doc, body) {
  
  var updates = getEstimateUpdates(workitem, doc, body);
  
  var dateCompl = workitem.info[InfoName.DateCompleted];
  
  if (dateCompl == undefined || (dateCompl != undefined && !isValidDate(new Date(dateCompl.value)))) {
    var monthAgo = getDateFromToday(-30);
    var modifiedDate = workitem.file.getLastUpdated();
    
    updates[InfoName.DateCompleted].value = new Date().toDateString(); //modifiedDate.toDateString();
  }
  
  var dateStarted = workitem.info[InfoName.DateStarted];
  
  if (dateStarted == undefined || 
     (dateStarted != undefined && !isValidDate(new Date(dateStarted.value)))) {
    if (updates[InfoName.DateCompleted] != undefined) {
      updates[InfoName.DateStarted].value = updates[InfoName.DateCompleted].value;
    }
    else if (workitem.info[InfoName.DateCompleted] != undefined) {
      updates[InfoName.DateStarted].value = workitem.info[InfoName.DateCompleted].value;
    }
    else {
      updates[InfoName.DateStarted].value = new Date().toDateString();
    }
  }
  
  return updates;
}

/**
* Called to update a work item with a status of 'on hold'.
*/
function getOnHoldUpdates(workitem, doc, body) {
  return null;
}

/**
* Called to update a work item with a status of 'abandoned'.
*/
function getAbandonedUpdates(workitem, doc, body) {
  return null;
}

/**
* 
*/
function getEstimateUpdates(workitem, doc, body) {
  var updates = new InfoUpdates();
  
  var curEstimate = NaN;
  var curAdjust = NaN;
  var adjustedEstimate = NaN;
  var prevEstimate = NaN;
  var finalEstimate = NaN;
  var estimateHistory = undefined;
  
  if (workitem.info[InfoName.EstimateHistory] != undefined)
    estimateHistory = workitem.info[InfoName.EstimateHistory].value;
  
  if (estimateHistory == undefined)
    estimateHistory = '';
  
  if (workitem.info[InfoName.Estimate] != undefined)
    curEstimate = parseFloat(workitem.info[InfoName.Estimate].value);
  if (workitem.info[InfoName.Adjust] != undefined)
    curAdjust = parseFloat(workitem.info[InfoName.Adjust].value);
  if (workitem.info[InfoName.AdjustedEstimate] != undefined)
    adjustedEstimate = parseFloat(workitem.info[InfoName.AdjustedEstimate].value);
  
  if (workitem.info[InfoName.Estimate] == undefined) {
    updates[InfoName.Estimate].value = '';
  }
  
  if (!isNullOrEmpty(estimateHistory)) {
    var matches = /\d+(\.?\d)*/i.exec(estimateHistory);
    
    if (matches != null)
      prevEstimate = parseFloat(matches[0]);
  }
  
  if (!isNaN(curEstimate)) {
    finalEstimate = curEstimate;
    
    if (workitem.info[InfoName.Adjust] != undefined) {
      var newTotal = curEstimate + (isNaN(curAdjust) ? 0 : curAdjust);
      
      if (adjustedEstimate != newTotal) {
        adjustedEstimate = newTotal;
        updates[InfoName.AdjustedEstimate].value = adjustedEstimate;
      }
      
      finalEstimate = newTotal;
    }
  }
  
  if (!isNaN(finalEstimate)) {
    if (prevEstimate != finalEstimate) {
      var newEntry = finalEstimate + " (" + (new Date().toDateString()) + ")";
      
      if (estimateHistory.length > 0)
        newEntry += ', ';
      
      estimateHistory = newEntry + estimateHistory;
      
      updates[InfoName.EstimateHistory].value = estimateHistory;
    }
  }
  
  return updates;
}

/**
*
*/
function isValidResource(name) {
  return !/bug/i.test(name);
}








