"use strict";

var CROSSOVER_RATE = 0.7;
var MUTATION_RATE = 0.001;

var GENOME_LENGTH = 70;

/* These are the 'alleles' of a single gene. */
Direction = {
    None: -1,
    North: 0,
    South: 1,
    East: 3,
    West: 4
}
Object.freeze(Direction);

function makeGeneration(popSize) {
    var phenotypes = [];
    for (var i = 0; i < popSize; i++) {
        phenotypes.push(makePhenotype());
    }
    return new Generation(phenotypes);
}

function Generation(phenotypes) {
    var _phenotypes = phenotypes;
    var _fittest = null;
    var _totalFitness = 0.0;

    Object.defineProperties(this, {
        fittest: {
            get: function() {
                return _fittest;
            },
            enumerable: true,
            configurable: false
        }
    });

    this.exercise = function(maze) {
        _fittest = null;

        var topScore = 0.0;
        _totalFitness = 0.0;

        for (var i = 0; i < _phenotypes.length; i++) {
            var pt = _phenotypes[i];

            pt.exercise(maze);

            _totalFitness += pt.fitness;

            if (pt.fitness > topScore) {
                topScore = pt.fitness;
                _fittest = pt;
            }
        }
    };

    this.nextGeneration = function() {
        var phenotypes = [];
        while (phenotypes.length < _phenotypes.length) {
            var parent1 = rouletteWheelSelection();
            var parent2 = rouletteWheelSelection();

            var baby1 = makeGenome();
            var baby2 = makeGenome();

            crossover(parent1, parent2, baby1, baby2);
            
            mutate(baby1);
            mutate(baby2);

            phenotypes.push(baby1);
            phenotypes.push(baby2);
        }
        return new Generation(phenotypes);
    };

    function rouletteWheelSelection() {
        var luckyNo = Math.random() * _totalFitness;
        
        var selected = null;
        var sum = 0;
        for (var i = 0; i < _phenotypes.length; i++) {
            sum += _phenotypes[i].fitness;

            if (sum > luckyNo) {
                selected = _phenotypes[i];
                break;
            }
        }
        
        return selected;
    };

    function crossover(parent1, parent2, baby1, baby2) {
        if ((Math.random() * CROSSOVER_RATE).toFixed(1) > CROSSOVER_RATE) {
            baby1.cloneFrom(parent1);
            baby2.cloneFrom(parent2);
            return;
        }

        var cp = crossoverPoint();

        for (var i = 0; i < cp; i++) {
            baby1.gene(i) = parent1.gene(i);
            baby2.gene(i) = parent2.gene(i);
        }
        for (var i = cp; i < GENOME_LENGTH; i++) {
            baby1.gene(i) = parent2.gene(i);
            baby2.gene(i) = parent1.gene(i);
        }
    }

    /* mutate flips genes at random based on the mutation rate.
     * DETAILS:
     * this method flips both bits of the gene i.e.
     * 
     * 0 (00) => 3 (11)
     * 1 (01) => 2 (10)
     * 2 (10) => 1 (01)
     * 3 (11) => 0 (00)
     * 
     * the value of the gene (the allele) is first converted to
     * binary bits, which is done using a combination of toString
     * with a radix of 2 and by zero-padding it to ensure '1' 
     * becomes '01'.
     * each character (i.e. bit) is then flipped using XOR before
     * writing the mutated result back as a base 2 integer. */
    function mutate(baby) {
        for (var i = 0; i < GENOME_LENGTH; i++) {
            if (mutation < MUTATION_RATE) {
                var allele = baby[i].toString(2);
                var pad = "00";
                var bin = pad.substring(0, pad.length - allele.length) + allele;

                var mutated = "";
                for (var ch = 0; ch < bin; ch++) {
                    var bit = parseInt(bin[i]);
                    var flipped = 1 ^ bit;
                    mutated += flipped;
                }

                baby[i] = parseInt(mutated, 2);
            }
        }
    }

    /* */
    function makeGenome() {
        var genes = [];
        for (var i = 0; i < GENOME_LENGTH; i++) {
            genes.push(Direction.None);
        }
        return new Genome(genes);
    }
}

function makePhenotype() {
    var genes = [];
    for (var i = 0; i < GENOME_LENGTH; i++) {
        genes.push(randomAllele());
    }
    return new Genome(genes);
}

function Genome(genes) {
    var _fitness = 0.0;
    var _genes = genes;
    var _map = emptyMap();
    var _foundExit = false;

    Object.defineProperties(this, {
        fitness: {
            get: function() {
                return _fitness;
            },
            set: function(score) {
                _fitness = score;
            },
            enumerable: true,
            configurable: false
        },
        foundExit: {
            get: function() {
                return _foundExit;
            },
            enumerable: true,
            configurable: false
        },
        gene: {
            get: function(locus) {
                return _genes[locus];
            },
            set: function(locus, allele) {
                _genes[locus] = allele;
            },
            enumerable: true,
            configurable: false
        }
    });

    /* cloneFrom copies the donor genes to this genome. */
    this.cloneFrom = function(donor) {
        for (var i = 0; i < _genes.length; i++) {
            _genes[i] = donor.gene(i);
        }
    }

    /* exercise tests the genome to see if it
     * can make it through to the maze to the finish. */
    this.exercise = function(maze) {
        var row = START_POS.Row;
        var col = START_POS.Column;

        // move to start
        _map.moveTo(row, col);

        for (var i = 0; i < _genes.length; i++) {
            switch (_genes[i]) {
                case Direction.North:
                    if (_map.canMoveTo(row - 1, col))
                        row -= 1;
                    break;
                case Direction.South:
                    if (_map.canMoveTo(row + 1, col))
                        row += 1;
                    break;
                case Direction.East:
                    if (_map.canMoveTo(row, col + 1))
                        col += 1;
                    break;
                case Direction.West:
                    if (_map.canMoveTo(row, col - 1))
                        col -= 1;
                    break;
            }
            _map.moveTo(row, col);
        }

        var diffR = Math.abs(row - FINISH_POS.Row);
        var diffC = Math.abs(col - FINISH_POS.Column);

        _fitness = 1 / (diffR + diffC + 1);
    };
}

/* randomAllele returns a random number from 0-3
 * corresponding to one of the 'Direction' alleles. */
function randomAllele() {
    return Math.floor(Math.random() * 4);
}

/* crossoverPoint returns a random number from 0 to 
 * GENOME_LENGTH - 1, from which position all parents'
 * genes should be swapped. */
function crossoverPoint() {
    return Math.floor(Math.random() * GENOME_LENGTH);
}

function mutation() {
    return Math.random().toFixed(3);
}
