var statusCodetraceWidth = 420;

var colourArray = ["#52bc69", "#d65775", "#2ebbd1", "#d9513c", "#fec515", "#4b65ba", "#ff8a27", "#a7d41e"];


function getColours() {
    var generatedColours = new Array();
    while (generatedColours.length < 4) {
        var n = (Math.floor(Math.random() * colourArray.length));
        if ($.inArray(n, generatedColours) == -1)
            generatedColours.push(n);
    }
    return generatedColours;
}

var generatedColours = getColours();
var surpriseColour = colourArray[generatedColours[0]];
var colourTheSecond = colourArray[generatedColours[1]];
var colourTheThird = colourArray[generatedColours[2]];
var colourTheFourth = colourArray[generatedColours[3]];

var isRadixSort = false;

var Sorting = function () {

    var HIGHLIGHT_NONE = "lightblue";
    var HIGHLIGHT_STANDARD = "green";
    var HIGHLIGHT_SPECIAL = "#DC143C";
    var HIGHLIGHT_SORTED = "orange";

    var HIGHLIGHT_LEFT = "#3CB371";
    var HIGHLIGHT_RIGHT = "#9932CC";
    var HIGHLIGHT_PIVOT = "yellow";

    var HIGHLIGHT_GRAY = "#CCCCCC";

    var barWidth = 50;
    var maxHeight = 230;
    var gapBetweenBars = 5;
    var maxNumOfElements = 15;
    var gapBetweenPrimaryAndSecondaryRows = 30; // of the bars
    var maxElementValue = 50;
    var maxRadixElementValue = 9999;


    // green, pink, blue, red, yellow, indigo, orange, lime


    var transitionTime = 750;
    var issPlaying;
    var animInterval;
    var currentStep;
    var centreBarsOffset;
    var computeInversionIndex = false;
    var radixSortBucketOrdering;

    this.selectedSortFunction;

    // list of states

    var scaler;
    var canvas;
    var radixSortCanvas;
    var width;

    scaler = d3.scale
        .linear()
        .range([0, maxHeight]);

    width = $(".gridGraph").width();

    canvas = d3.select("#viz-canvas")
        .attr("height", maxHeight * 2 + gapBetweenPrimaryAndSecondaryRows)
        .attr("width", width);

    radixSortCanvas = d3.select("#viz-radix-sort-canvas");

    var statelist = new Array();
    var secondaryStateList = new Array();
    var POSITION_USE_PRIMARY = "a";
    var POSITION_USE_SECONDARY_IN_DEFAULT_POSITION = "b";

    // Objects definition

    var Entry = function (value, highlight, position, secondaryPositionStatus) {
        this.value = value; // number
        this.highlight = highlight; // string, use HIGHLIGHT_ constants
        this.position = position; // number
        this.secondaryPositionStatus = secondaryPositionStatus; // integer, +ve for position overwrite, -ve for absolute postion (-1 for 0th absolution position)
    }

    var Backlink = function (value, highlight, entryPosition, secondaryPositionStatus) {
        this.value = value; // number
        this.highlight = highlight; // string, use HIGHLIGHT_ constants
        this.entryPosition = entryPosition; // number
        this.secondaryPositionStatus = secondaryPositionStatus; // integer, +ve for position overwrite
    }

    var State = function (entries, backlinks, barsCountOffset, status, lineNo, logMessage) {
        this.entries = entries; // array of Entry's
        this.backlinks = backlinks; // array of Backlink's
        this.barsCountOffset = barsCountOffset; // how many bars to "disregard" (+ve) or to "imagine" (-ve) w.r.t. state.entries.length when calculating the centre position
        this.status = status;
        this.lineNo = lineNo; //integer or array, line of the code to highlight
        this.logMessage = logMessage;
    }

    //Helpers

    var EntryBacklinkHelper = new Object();
    EntryBacklinkHelper.appendList = function (entries, backlinks, numArray) {
        for (var i = 0; i < numArray.length; i++) {
            EntryBacklinkHelper.append(entries, backlinks, numArray[i]);
        }
    }

    EntryBacklinkHelper.append = function (entries, backlinks, newNumber) {
        entries.push(new Entry(newNumber, HIGHLIGHT_NONE, entries.length, POSITION_USE_PRIMARY));
        backlinks.push(new Backlink(newNumber, HIGHLIGHT_NONE, backlinks.length, POSITION_USE_PRIMARY));
    }

    EntryBacklinkHelper.update = function (entries, backlinks) {
        for (var i = 0; i < backlinks.length; i++) {
            entries[backlinks[i].entryPosition].highlight = backlinks[i].highlight;
            entries[backlinks[i].entryPosition].position = i;
            entries[backlinks[i].entryPosition].secondaryPositionStatus = backlinks[i].secondaryPositionStatus;
        }
    }

    EntryBacklinkHelper.copyEntry = function (oldEntry) {
        return new Entry(oldEntry.value, oldEntry.highlight, oldEntry.position, oldEntry.secondaryPositionStatus);
    }

    EntryBacklinkHelper.copyBacklink = function (oldBacklink) {
        return new Backlink(oldBacklink.value, oldBacklink.highlight, oldBacklink.entryPosition, oldBacklink.secondaryPositionStatus);
    }

    EntryBacklinkHelper.swapBacklinks = function (backlinks, i, j) {
        var swaptemp = backlinks[i];
        backlinks[i] = backlinks[j];
        backlinks[j] = swaptemp;
    }

    // class StateHelper
    var StateHelper = new Object();

    StateHelper.createNewState = function (numArray) {
        var entries = new Array();
        var backlinks = new Array();
        EntryBacklinkHelper.appendList(entries, backlinks, numArray);
        return new State(entries, backlinks, 0, "", 0);
    }

    StateHelper.copyState = function (oldState) {
        var newEntries = new Array();
        var newBacklinks = new Array();
        for (var i = 0; i < oldState.backlinks.length; i++) {
            newEntries.push(EntryBacklinkHelper.copyEntry(oldState.entries[i]));
            newBacklinks.push(EntryBacklinkHelper.copyBacklink(oldState.backlinks[i]));
        }

        var newLineNo = oldState.lineNo;
        if (newLineNo instanceof Array)
            newLineNo = oldState.lineNo.slice();

        return new State(newEntries, newBacklinks, oldState.barsCountOffset, oldState.status, newLineNo, oldState.logMessage);
    }

    StateHelper.updateCopyPush = function (list, stateToPush) {
        EntryBacklinkHelper.update(stateToPush.entries, stateToPush.backlinks);
        list.push(StateHelper.copyState(stateToPush));
    }
    // end class StateHelper

    // class FunctionList

    var FunctionList = new Object();
    FunctionList.text_y = function (d) {
        var barHeight = scaler(d.value);
        if (barHeight < 32) return -15;
        return barHeight - 15;
    }

    FunctionList.g_transform = function (d) {
        if (d.secondaryPositionStatus == POSITION_USE_PRIMARY)
            return 'translate(' + (centreBarsOffset + d.position * barWidth) + ", " + (maxHeight - scaler(d.value)) + ')';
        else if (d.secondaryPositionStatus == POSITION_USE_SECONDARY_IN_DEFAULT_POSITION)
            return 'translate(' + (centreBarsOffset + d.position * barWidth) + ", " + (maxHeight * 2 + gapBetweenPrimaryAndSecondaryRows - scaler(d.value)) + ')';
        else if (d.secondaryPositionStatus >= 0)
            return 'translate(' + (centreBarsOffset + d.secondaryPositionStatus * barWidth) + ", " + (maxHeight * 2 + gapBetweenPrimaryAndSecondaryRows - scaler(d.value)) + ')';
        else if (d.secondaryPositionStatus < 0)
            return 'translate(' + ((d.secondaryPositionStatus * -1 - 1) * barWidth) + ", " + (maxHeight * 2 + gapBetweenPrimaryAndSecondaryRows - scaler(d.value)) + ')';
        else
            return 'translation(0, 0)';
    }

    FunctionList.radixElement_left = function (d) {
        if (d.secondaryPositionStatus == POSITION_USE_PRIMARY) {
            return d.position * 65 + centreBarsOffset + "px";
        }
        return d.secondaryPositionStatus * 65 + 520 + "px";
    }

    FunctionList.radixElement_bottom = function (d, i) {
        if (d.secondaryPositionStatus == POSITION_USE_PRIMARY) {
            return 900 - 24 + "px";
        }
        return radixSortBucketOrdering[i] * 30 + 625 + "px";
    }

    FunctionList.radixElement_html = function (d) {
        if (d.highlight == HIGHLIGHT_NONE) {
            return d.value;
        }

        var text = "" + d.value;
        while (text.length != 4) {
            text = " " + text;
        }

        var positionToHighLight = 0;
        var positionCounter = d.highlight;
        while (positionCounter != 1) {
            positionToHighLight++;
            positionCounter /= 10;
        }

        positionToHighLight = 3 - positionToHighLight;

        if (text.charAt(positionToHighLight) != " ") {
            text = text.slice(0, positionToHighLight) + "<span style='color: red;'>" + text.charAt(positionToHighLight) + "</span>" + text.slice(positionToHighLight + 1);
        }

        text = text.trim();
        return text;
    }

    // end class FunctionList

    var generateRandomNumber = function (min, max) { //generates a random integer between min and max (both inclusive)
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    var generateRandomNumberArray = function (size, limit) {
        var numArray = new Array();
        for (var i = 0; i < size; i++) {
            numArray.push(generateRandomNumber(1, limit));
        }
        return numArray;
    };

    var generateRandomNumber = function (min, max) { //generates a random integer between min and max (both inclusive)
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    this.clearPseudocode = function () {
        populatePseudocode([]);
    }

    this.clearLog = function () {
        $('#log > p').html('');
    }

    this.clearStatus = function () {
        $('#status > p').html('');
    }

    var populatePseudocode = function (code) {
        var i = 1;
        for (; i <= 12 && i <= code.length; i++) {
            $("#code" + i).html(
                code[i - 1].replace(
                    /^\s+/,
                    function (m) {
                        return m.replace(/\s/g, "&nbsp;");
                    }
                )
            );
        }
        for (; i <= 7; i++) {
            $("#code" + i).html("");
        }
    }

    var initLogMessage = function (state) {
        state.logMessage = "original array = [";

        for (var i = 0; i < state.backlinks.length - 1; i++) {
            state.logMessage += state.backlinks[i].value + ", ";
        }

        state.logMessage += state.backlinks[state.backlinks.length - 1].value + "]";
    }

    this.bubbleSort = function (callback) {
        var numElements = statelist[0].backlinks.length;
        var state = StateHelper.copyState(statelist[0]);
        var swapCounter = 0;

        populatePseudocode([
            'do',
            '  swapped = false',
            '  for i = 1 to indexOfLastUnsortedElement-1',
            '    if leftElement > rightElement',
            '      swap(leftElement, rightElement)',
            '      swapped = true' + ((this.computeInversionIndex) ? '; swapCounter++' : ""),
            'while swapped'
        ]);

        initLogMessage(state);

        var swapped;
        var indexOfLastUnsortedElement = numElements;
        do {
            swapped = false;

            // Set the swapped flag to false.
            // Then iterate from 1 to {endIdx} inclusive.
            state.status = '<div>Set the swapped flag to false.</div><div>Then iterate from 1 to {endIdx} inclusive.</div>'.replace("{endIdx}", indexOfLastUnsortedElement - 1);
            state.logMessage = '<div>Set the swapped flag to false.</div><div>Then iterate from 1 to {endIdx} inclusive.</div>'.replace("{endIdx}", indexOfLastUnsortedElement - 1)
                + state.logMessage;
            state.lineNo = [2, 3];
            StateHelper.updateCopyPush(statelist, state);

            for (var i = 1; i < indexOfLastUnsortedElement; i++) {
                state.backlinks[i - 1].highlight = HIGHLIGHT_STANDARD;
                state.backlinks[i].highlight = HIGHLIGHT_STANDARD;

                // Checking if {val1} > {val2} and swap them if that is true.
                // The current value of swapped = {swapped}.
                state.status = '<div>Checking if {val1} &gt; {val2} and swap them if that is true.</div><div>The current value of swapped = {swapped}.</div>'
                    .replace("{val1}", state.backlinks[i - 1].value)
                    .replace("{val2}", state.backlinks[i].value)
                    .replace("{swapped}", swapped);
                state.logMessage = '<div>Checking if {val1} &gt; {val2} and swap them if that is true.</div><div>The current value of swapped = {swapped}.</div>'
                    .replace("{val1}", state.backlinks[i - 1].value)
                    .replace("{val2}", state.backlinks[i].value)
                    .replace("{swapped}", swapped) + state.logMessage;
                state.lineNo = 4;
                StateHelper.updateCopyPush(statelist, state);

                if (state.backlinks[i - 1].value > state.backlinks[i].value) {
                    swapped = true;

                    // Swapping the positions of {val1} and {val2}.
                    // Set swapped = true.
                    state.status = '<div>Swapping the positions of {val1} and {val2}.</div><div>Set swapped = true.</div>'
                        .replace("{val1}", state.backlinks[i - 1].value)
                        .replace("{val2}", state.backlinks[i].value);
                    // state.logMessage = '<div>swap {val1} and {val2}</div>'
                    //     .replace("{val1}", state.backlinks[i - 1].value)
                    //     .replace("{val2}", state.backlinks[i].value) + state.logMessage;
                    state.logMessage = '<div>Swapping the positions of {val1} and {val2}.</div><div>Set swapped = true.</div>'
                        .replace("{val1}", state.backlinks[i - 1].value)
                        .replace("{val2}", state.backlinks[i].value) + state.logMessage;
                    if (this.computeInversionIndex) {
                        swapCounter++;
                        // For inversion index computation: Add 1 to swapCounter.
                        // The current value of swapCounter = {swapCounter}.
                        state.status += ' For inversion index: Add 1 to swapCounter.<div>Current value of swapCounter = {swapCounter}.</div>'.replace("{swapCounter}", swapCounter);
                    }

                    state.lineNo = [5, 6];

                    EntryBacklinkHelper.swapBacklinks(state.backlinks, i, i - 1);
                    StateHelper.updateCopyPush(statelist, state);
                }

                state.backlinks[i - 1].highlight = HIGHLIGHT_NONE;
                state.backlinks[i].highlight = HIGHLIGHT_NONE;
            }

            indexOfLastUnsortedElement--;
            state.backlinks[indexOfLastUnsortedElement].highlight = HIGHLIGHT_SORTED;
            if (swapped == false)
                // No swap is done in this pass.
                // We can terminate Bubble Sort now.
                state.status = '<div>No swap is done in this pass.</div><div>We can terminate Bubble Sort now</div>';
            // state.logMessage = '<div>No swap is done in this pass.</div><div>We can terminate Bubble Sort now</div>' + state.logMessage;
            else {
                // Mark last unsorted element as sorted now.
                // As at least one swap is done in this pass, we continue.
                state.status = '<div>Mark last unsorted element as sorted now.</div><div>As at least one swap is done in this pass, we continue.</div>';
                state.logMessage = '<div>Mark last unsorted element as sorted now.</div><div>As at least one swap is done in this pass, we continue.</div>' + state.logMessage;
            }
            state.lineNo = 7;
            StateHelper.updateCopyPush(statelist, state);
        }
        while (swapped);

        for (var i = 0; i < numElements; i++)
            state.backlinks[i].highlight = HIGHLIGHT_SORTED;

        // The array/list is now sorted.
        state.status = '<div>List sorted!</div>';
        state.logMessage = '<div>List sorted!</div>' + state.logMessage;
        if (this.computeInversionIndex)
            // Inversion Index = {swapCounter}.
            state.status += ' Inversion Index = {swapCounter}.'.replace("swapCounter", swapCounter);

        state.lineNo = 0;
        StateHelper.updateCopyPush(statelist, state);

        this.play(callback);
        return true;
    }

    this.selectionSort = function (callback) {
        var numElements = statelist[0].backlinks.length;
        var state = StateHelper.copyState(statelist[0]);

        populatePseudocode([
            'repeat (numOfElements - 1) times',
            '  set the first unsorted element as the minimum',
            '  for each of the unsorted elements',
            '    if element < currentMinimum',
            '      set element as new minimum',
            '  swap minimum with first unsorted position'
        ]);

        initLogMessage(state);

        for (var i = 0; i < numElements - 1; i++) {
            var minPosition = i;

            // Iteration {iteration}: Set {val} as the current minimum.
            // Then iterate through the rest to find the true minimum.
            state.status = '<div>Iteration {iteration}: Set {val} as the current minimum, then iterate through the remaining unsorted elements to find the true minimum.</div>'
                .replace("{iteration}", (i + 1))
                .replace("{val}", state.backlinks[i].value);
            state.logMessage = '<div>Iteration {iteration}: Set {val} as the current minimum, then iterate through the remaining unsorted elements to find the true minimum.</div>'
                .replace("{iteration}", (i + 1))
                .replace("{val}", state.backlinks[i].value) + state.logMessage;
            state.lineNo = [1, 2, 3];
            state.backlinks[minPosition].highlight = HIGHLIGHT_SPECIAL;

            StateHelper.updateCopyPush(statelist, state);

            for (var j = i + 1; j < numElements; j++) {
                // Check if {val} is smaller than the current minimum ({minVal}).
                state.status = '<div>Check if {val} is smaller than the current minimum ({minVal}).</div>'
                    .replace("{val}", state.backlinks[j].value)
                    .replace("{minVal}", state.backlinks[minPosition].value);
                state.logMessage = '<div>Check if {val} is smaller than the current minimum ({minVal}).</div>'
                    .replace("{val}", state.backlinks[j].value)
                    .replace("{minVal}", state.backlinks[minPosition].value) + state.logMessage;
                state.lineNo = 4;
                state.backlinks[j].highlight = HIGHLIGHT_STANDARD;
                StateHelper.updateCopyPush(statelist, state);

                state.backlinks[j].highlight = HIGHLIGHT_NONE;

                if (state.backlinks[j].value < state.backlinks[minPosition].value) {
                    state.status = '<div>Set {val} as the new minimum.</div>'
                        .replace("{val}", state.backlinks[j].value);
                    // state.logMessage = '<div>{val} is the current minimum</div>'
                    //     .replace("{val}", state.backlinks[j].value) + state.logMessage;
                    state.logMessage = '<div>Set {val} as the new minimum.</div>'
                        .replace("{val}", state.backlinks[j].value) + state.logMessage;
                    state.lineNo = 5;
                    state.backlinks[minPosition].highlight = HIGHLIGHT_NONE;
                    state.backlinks[j].highlight = HIGHLIGHT_SPECIAL;

                    minPosition = j;
                    StateHelper.updateCopyPush(statelist, state);
                }
            }

            if (minPosition != i) { // Highlight the first-most unswapped position, if it isn't the minimum
                // Set {val} as the new minimum.
                state.status = '<div>Swap the minimum ({minVal}) with the first unsorted element ({element}).</div>'
                    .replace("{minVal}", state.backlinks[minPosition].value)
                    .replace("{element}", state.backlinks[i].value);

                // state.logMessage = '<div>swap {minVal} and {element}</div>'
                //     .replace("{minVal}", state.backlinks[minPosition].value)
                //     .replace("{element}", state.backlinks[i].value) + state.logMessage;
                state.logMessage = '<div>Swap the minimum ({minVal}) with the first unsorted element ({element}).</div>'
                    .replace("{minVal}", state.backlinks[minPosition].value)
                    .replace("{element}", state.backlinks[i].value) + state.logMessage;

                state.lineNo = 6;
                state.backlinks[i].highlight = HIGHLIGHT_SPECIAL;
                StateHelper.updateCopyPush(statelist, state);

                EntryBacklinkHelper.swapBacklinks(state.backlinks, minPosition, i);
                StateHelper.updateCopyPush(statelist, state);
            }
            else {
                // As the minimum is the first unsorted element, no swap is necessary.
                state.status = '<div>As the minimum is the first unsorted element, no swap is necessary.</div>';
                state.logMessage = '<div>As the minimum is the first unsorted element, no swap is necessary.</div>' + state.logMessage;
                state.lineNo = 6;
                StateHelper.updateCopyPush(statelist, state);
            }

            // {val} is now considered sorted.
            state.status = '<div>{val} is now considered sorted.</div>'.replace("{val}", state.backlinks[i].value);
            state.logMessage = '<div>{val} is now considered sorted.</div>'.replace("{val}", state.backlinks[i].value) + state.logMessage;
            state.backlinks[minPosition].highlight = HIGHLIGHT_NONE;
            state.backlinks[i].highlight = HIGHLIGHT_SORTED;
            StateHelper.updateCopyPush(statelist, state);
        }

        for (var i = 0; i < numElements; i++)
            state.backlinks[i].highlight = HIGHLIGHT_SORTED; // highlight everything
        // The array/list is now sorted.
        // (After all iterations, the last element will naturally be sorted.)
        state.status = 'List sorted!' + '<br>' + '(After all iterations, the last element will naturally be sorted.)';
        state.logMessage = "<div>List sorted!</div>" + state.logMessage;
        status.lineNo = 0;
        StateHelper.updateCopyPush(statelist, state);

        this.play(callback);
        return true;
    }

    var quickSortUseRandomizedPivot;

    var quickSortStart = function () {
        var numElements = statelist[0].backlinks.length;
        var state = StateHelper.copyState(statelist[statelist.length - 1]);

        populatePseudocode([
            'for each (unsorted) partition',
            (quickSortUseRandomizedPivot) ? 'randomly select pivot, swap with first element' : 'set first element as pivot',
            '  storeIndex = pivotIndex + 1',
            '  for i = pivotIndex + 1 to rightmostIndex',
            '    if element[i] < element[pivot]',
            '      swap(i, storeIndex); storeIndex++',
            '  swap(pivot, storeIndex - 1)'
        ]);

        initLogMessage(state);

        quickSortSplit(state, 0, numElements - 1);

        state.lineNo = 0;
        state.status = '<div>List sorted!</div>';
        state.logMessage = '<div>List sorted!</div>' + state.logMessage;

        for (var i = 0; i < numElements; i++)
            state.backlinks[i].highlight = HIGHLIGHT_SORTED; //unhighlight everything
        StateHelper.updateCopyPush(statelist, state);
    }

    var quickSortSplit = function (state, startIndex, endIndex) { //startIndex & endIndex inclusive
        state.status = '<div>Working on partition [{partition}] (index {startIndex} to {endIndex} both inclusive).</div>'
            .replace("{partition}", state.backlinks.slice(startIndex, endIndex + 1).map(function (d) {
                return d.value;
            }))
            .replace("{startIndex}", startIndex).replace("{endIndex}", endIndex);
        state.logMessage = '<div>Working on partition [{partition}] (index {startIndex} to {endIndex} both inclusive).</div>'
            .replace("{partition}", state.backlinks.slice(startIndex, endIndex + 1).map(function (d) {
                return d.value;
            }))
            .replace("{startIndex}", startIndex).replace("{endIndex}", endIndex) + state.logMessage;
        state.lineNo = 1;

        if (startIndex > endIndex)
            return;

        if (startIndex == endIndex) {
            state.status += '<div>Since partition size == 1, element inside partition is necessarily at sorted position.</div>';
            state.logMessage += '<div>Since partition size == 1, element inside partition is necessarily at sorted position.</div>' + state.logMessage;
            state.backlinks[startIndex].highlight = HIGHLIGHT_SORTED;
            StateHelper.updateCopyPush(statelist, state);
            return;
        }

        var middleIndex = quickSortPartition(state, startIndex, endIndex);
        quickSortSplit(state, startIndex, middleIndex - 1);
        quickSortSplit(state, middleIndex + 1, endIndex);
    }

    var quickSortPartition = function (state, startIndex, endIndex) {

        var pivotIndex;
        if (quickSortUseRandomizedPivot) {

            pivotIndex = generateRandomNumber(startIndex, endIndex);

            state.status += '<div>Randomly selected {pivot} (index {index}) as pivot.</div>'
                .replace("{pivot}", state.backlinks[pivotIndex].value)
                .replace("{index}", pivotIndex);
            state.logMessage += '<div>Randomly selected {pivot} (index {index}) as pivot.</div>'
                .replace("{pivot}", state.backlinks[pivotIndex].value)
                .replace("{index}", pivotIndex) + state.logMessage;
            state.lineNo = [1, 2];

            state.backlinks[pivotIndex].highlight = HIGHLIGHT_PIVOT;
            StateHelper.updateCopyPush(statelist, state);

            if (pivotIndex != startIndex) {
                state.status = '<div>Swap pivot ({pivot}}, index {index}) with first element ({first}, index {firstIndex}). (storeIndex = {storeIndex}.)</div>'
                    .replace("{pivot}", state.backlinks[pivotIndex].value)
                    .replace("{index}", pivotIndex)
                    .replace("{first}", state.backlinks[startIndex].value)
                    .replace("{firstIndex}", startIndex)
                    .replace("{storeIndex}", (startIndex + 1));
                state.logMessage = '<div>Swap pivot ({pivot}}, index {index}) with first element ({first}, index {firstIndex}). (storeIndex = {storeIndex}.)</div>'
                    .replace("{pivot}", state.backlinks[pivotIndex].value)
                    .replace("{index}", pivotIndex)
                    .replace("{first}", state.backlinks[startIndex].value)
                    .replace("{firstIndex}", startIndex)
                    .replace("{storeIndex}", (startIndex + 1)) + state.logMessage;

                state.lineNo = [2, 3];

                EntryBacklinkHelper.swapBacklinks(state.backlinks, pivotIndex, startIndex);
                pivotIndex = startIndex;
                StateHelper.updateCopyPush(statelist, state);
            }
        }
        else {
            pivotIndex = startIndex;

            state.status += '<div>Selecting {pivot} as pivot. (storeIndex = {storeIndex}.)</div>'
                .replace("{pivot}", state.backlinks[pivotIndex].value)
                .replace("{storeIndex}", (startIndex + 1));

            // state.logMessage = '<div>Select {val} as pivot</div>'
            //     .replace("{val}", state.backlinks[pivotIndex].value) + state.logMessage;
            state.logMessage += '<div>Selecting {pivot} as pivot. (storeIndex = {storeIndex}.)</div>'
                .replace("{pivot}", state.backlinks[pivotIndex].value)
                .replace("{storeIndex}", (startIndex + 1)) + state.logMessage;

            state.lineNo = [1, 2, 3];

            state.backlinks[pivotIndex].highlight = HIGHLIGHT_PIVOT;
            StateHelper.updateCopyPush(statelist, state);
        }

        var storeIndex = pivotIndex + 1;
        var pivotValue = state.backlinks[pivotIndex].value;

        for (var i = storeIndex; i <= endIndex; i++) {
            state.status = '<div>Checking if {val} < {pivot} (pivot).</div>'
                .replace("{val}", state.backlinks[i].value)
                .replace("{pivot}", pivotValue);
            state.logMessage = '<div>Checking if {val} < {pivot} (pivot).</div>'
                .replace("{val}", state.backlinks[i].value)
                .replace("{pivot}", pivotValue) + state.logMessage;
            state.lineNo = [4, 5];

            state.backlinks[i].highlight = HIGHLIGHT_SPECIAL;
            StateHelper.updateCopyPush(statelist, state);
            if (state.backlinks[i].value < pivotValue) {

                state.status = '<div>{val} < {pivot} (pivot) is true. <div>Swapping index {idx} (value = {valI}) with element at storeIndex (index = {storeIdx}, value = {storeVal}).</div> (Value of storeIndex after swap = {newStoreIdx}).</div>'
                    .replace("{idx}", i)
                    .replace("{val}", state.backlinks[i].value)
                    .replace("{valI}", state.backlinks[i].value)
                    .replace("{pivot}", pivotValue)
                    .replace("{storeIdx}", storeIndex)
                    .replace("{storeVal}", state.backlinks[storeIndex].value)
                    .replace("{newStoreIdx}", (storeIndex + 1));
                state.logMessage = '<div>{val} < {pivot} (pivot) is true. <div>Swapping index {idx} (value = {valI}) with element at storeIndex (index = {storeIdx}, value = {storeVal}).</div> (Value of storeIndex after swap = {newStoreIdx}).</div>'
                    .replace("{idx}", i)
                    .replace("{val}", state.backlinks[i].value)
                    .replace("{valI}", state.backlinks[i].value)
                    .replace("{pivot}", pivotValue)
                    .replace("{storeIdx}", storeIndex)
                    .replace("{storeVal}", state.backlinks[storeIndex].value)
                    .replace("{newStoreIdx}", (storeIndex + 1)) + state.logMessage;

                state.lineNo = [4, 6];

                if (i != storeIndex) {
                    state.logMessage = '<div>Swap {val1} and {val2}</div>'
                        .replace("{val1}", state.backlinks[i].value)
                        .replace("{val2}", state.backlinks[storeIndex].value) + state.logMessage;
                    EntryBacklinkHelper.swapBacklinks(state.backlinks, storeIndex, i);
                    StateHelper.updateCopyPush(statelist, state);
                }

                state.backlinks[storeIndex].highlight = HIGHLIGHT_LEFT;
                storeIndex++;
            }
            else {
                state.backlinks[i].highlight = HIGHLIGHT_RIGHT;
            }
        }
        state.status = '<div>Iteration complete.</div>';
        state.logMessage = '<div>Iteration complete.</div>' + state.logMessage;
        state.lineNo = 4;
        StateHelper.updateCopyPush(statelist, state);
        if (storeIndex - 1 != pivotIndex) {
            state.status = '<div>Swapping pivot (index = {pivotIdx}, value = {pivot}) with element at storeIndex - 1 (index = {newIdx}, value = {newVal}).</div>'
                .replace("{pivotIdx}", pivotIndex)
                .replace("{pivot}", pivotValue)
                .replace("{newIdx}", (storeIndex - 1))
                .replace("{newVal}", state.backlinks[storeIndex - 1].value);

            // state.logMessage = '<div>Swap {val1} and {val2}</div>'
            //     .replace("{val1}", pivotValue)
            //     .replace("{val2}", state.backlinks[storeIndex - 1].value) + state.logMessage;
            state.logMessage = '<div>Swapping pivot (index = {pivotIdx}, value = {pivot}) with element at storeIndex - 1 (index = {newIdx}, value = {newVal}).</div>'
                .replace("{pivotIdx}", pivotIndex)
                .replace("{pivot}", pivotValue)
                .replace("{newIdx}", (storeIndex - 1))
                .replace("{newVal}", state.backlinks[storeIndex - 1].value) + state.logMessage;

            state.lineNo = 7;
            EntryBacklinkHelper.swapBacklinks(state.backlinks, storeIndex - 1, pivotIndex);
            StateHelper.updateCopyPush(statelist, state);
        }

        state.status = '<div>Pivot is now at its sorted position.</div>';
        state.logMessage = '<div>Pivot is now at its sorted position.</div>' + state.logMessage;
        state.lineNo = 7;

        for (var i = startIndex; i <= endIndex; i++)
            state.backlinks[i].highlight = HIGHLIGHT_NONE; //unhighlight everything
        state.backlinks[storeIndex - 1].highlight = HIGHLIGHT_SORTED;
        StateHelper.updateCopyPush(statelist, state);

        return storeIndex - 1;
    }

    this.quickSort = function (callback) {
        quickSortUseRandomizedPivot = false;
        quickSortStart();

        this.play(callback);
        return true;
    }

    this.insertionSort = function (callback) {
        var numElements = statelist[0].backlinks.length;
        var state = StateHelper.copyState(statelist[0]);

        populatePseudocode([
            'mark first element as sorted',
            '  for each unsorted element X',
            '    extract the element X',
            '    for j = lastSortedIndex down to 0',
            '      if current element j > X',
            '        move sorted element to the right by 1',
            '      break loop and insert X here'
        ]);

        initLogMessage(state);

        // Mark first element is sorted
        state.status = "<div>Mark the first element ({first}) as sorted.</div>"
            .replace('{first}', state.backlinks[0].value);
        state.logMessage = "<div>Mark the first element ({first}) as sorted.</div>"
            .replace('{first}', state.backlinks[0].value) + state.logMessage;
        state.backlinks[0].highlight = HIGHLIGHT_SORTED;
        state.lineNo = 1;
        StateHelper.updateCopyPush(statelist, state);

        // Start loop forward
        for (var i = 1; i < numElements; i++) {
            state.backlinks[i].highlight = HIGHLIGHT_SPECIAL;
            state.lineNo = [2, 3];
            state.status = "<div>Extract the first unsorted element ({val}).</div>"
                .replace('{val}', state.backlinks[i].value);
            state.logMessage = "<div>Extract the first unsorted element ({val}).</div>"
                .replace('{val}', state.backlinks[i].value) + state.logMessage;
            StateHelper.updateCopyPush(statelist, state);
            state.backlinks[i].secondaryPositionStatus = POSITION_USE_SECONDARY_IN_DEFAULT_POSITION;

            // Start loop backward from i index
            for (var j = (i - 1); j >= 0; j--) {
                state.backlinks[j].highlight = HIGHLIGHT_STANDARD;
                state.lineNo = 4;
                state.status = "<div>Figure where to insert extracted element; comparing with sorted element {val}.</div>".replace('{val}', state.backlinks[j].value);
                state.logMessage = "<div>Figure where to insert extracted element; comparing with sorted element {val}.</div>".replace('{val}', state.backlinks[j].value) + state.logMessage;
                StateHelper.updateCopyPush(statelist, state);
                if (state.backlinks[j].value > state.backlinks[j + 1].value) {
                    // Swap
                    state.backlinks[j].highlight = HIGHLIGHT_SORTED;
                    state.lineNo = [5, 6];
                    state.status = "<div>{val1} > {val2} is true, hence move current sorted element ({val}) to the right by 1.</div>"
                        .replace('{val1}', state.backlinks[j].value)
                        .replace('{val2}', state.backlinks[j + 1].value)
                        .replace('{val}', state.backlinks[j].value);
                    state.logMessage = "<div>{val1} > {val2} is true, hence move current sorted element ({val}) to the right by 1.</div>"
                        .replace('{val1}', state.backlinks[j].value)
                        .replace('{val2}', state.backlinks[j + 1].value)
                        .replace('{val}', state.backlinks[j].value) + state.logMessage;
                    EntryBacklinkHelper.swapBacklinks(state.backlinks, j, j + 1);

                    if (j > 0) {
                        state.backlinks[j - 1].highlight = HIGHLIGHT_STANDARD;
                        StateHelper.updateCopyPush(statelist, state);
                    }
                } else {
                    state.backlinks[j].highlight = HIGHLIGHT_SORTED;
                    state.backlinks[j + 1].highlight = HIGHLIGHT_SORTED;
                    state.lineNo = 7;
                    state.status = "<div>{val1} > {val2} is false, insert element at current position.</div>"
                        .replace('{val1}', state.backlinks[j].value)
                        .replace('{val2}', state.backlinks[j + 1].value);
                    state.logMessage = "<div>{val1} > {val2} is false, insert element at current position.</div>"
                        .replace('{val1}', state.backlinks[j].value)
                        .replace('{val2}', state.backlinks[j + 1].value) + state.logMessage;
                    state.backlinks[j + 1].secondaryPositionStatus = POSITION_USE_PRIMARY;
                    StateHelper.updateCopyPush(statelist, state);
                    break;
                }

                if (j == 0) {
                    StateHelper.updateCopyPush(statelist, state);

                    state.backlinks[j].secondaryPositionStatus = POSITION_USE_PRIMARY;
                    // StateHelper.updateCopyPush(statelist, state);
                    state.backlinks[j].highlight = HIGHLIGHT_SORTED;
                    StateHelper.updateCopyPush(statelist, state);

                }
            } // End backward loop
        } // End forward loop

        state.lineNo = 0;
        state.status = "<div>List sorted!</div>";
        state.logMessage = "<div>List sorted!</div>" + state.logMessage;
        StateHelper.updateCopyPush(statelist, state);

        this.play(callback);
        return true;
    }

    this.cocktailShakerSort = function (callback) {
        var numElements = statelist[0].backlinks.length;
        var state = StateHelper.copyState(statelist[0]);

        populatePseudocode([
            'swapped = false, start = 0, end = last index',
            'while (swapped = true)',
            '  for i = start to end',
            '    if leftElement > rightElement',
            '      swap(leftElement, rightElement); swapped = true',
            '  if swapped = false: break loop',
            '  else: swapped = false and end--',
            '  for i = end to start',
            '    if rightElement < leftElement',
            '      swap(leftElement, rightElement); swapped = true',
            '  if swapped = false: break loop',
            '  else: swapped = false and start++'
        ]);

        initLogMessage(state);

        var swapped = true;
        var start = 0;
        var end = numElements;

        // Start while loop
        while (swapped) {
            // Reset the swapped flag to enter the loop
            swapped = false;
            state.lineNo = 2;
            StateHelper.updateCopyPush(statelist, state);

            // Start loop forward, sort like bubble sort
            for (var i = start; i < end - 1; i++) {
                state.backlinks[i].highlight = HIGHLIGHT_STANDARD;
                state.lineNo = 3;
                state.status = "<div>Extract left unsorted element ({val}).</div>".replace('{val}', state.backlinks[i].value);
                state.logMessage = "<div>Extract left unsorted element ({val}).</div>".replace('{val}', state.backlinks[i].value) + state.logMessage;
                StateHelper.updateCopyPush(statelist, state);

                if (i + 1 <= end) {
                    state.backlinks[i + 1].highlight = HIGHLIGHT_SPECIAL;
                    state.lineNo = 4;
                    state.status = "<div>Checking if {val1} > {val2}.</div>".replace('{val1}', state.backlinks[i].value).replace('{val2}', state.backlinks[i + 1].value);
                    state.logMessage = "<div>Checking if {val1} > {val2}.</div>".replace('{val1}', state.backlinks[i].value).replace('{val2}', state.backlinks[i + 1].value) + state.logMessage;
                    StateHelper.updateCopyPush(statelist, state);
                }

                if (state.backlinks[i].value > state.backlinks[i + 1].value) {
                    EntryBacklinkHelper.swapBacklinks(state.backlinks, i, i + 1);
                    state.backlinks[i].highlight = HIGHLIGHT_NONE;
                    state.lineNo = 5;
                    if (i === end - 2) {
                        state.backlinks[end - 1].highlight = HIGHLIGHT_SORTED;
                    }
                    state.status = "<div>{val1} > {val2}, swap positions of {val1} and {val2}</div><div>Set swapped = true</div>"
                        .replace(/{val1}/g, state.backlinks[i + 1].value)
                        .replace(/{val2}/g, state.backlinks[i].value);
                    state.logMessage = "<div>{val1} > {val2}, swap positions of {val1} and {val2}</div><div>Set swapped = true</div>"
                        .replace(/{val1}/g, state.backlinks[i + 1].value)
                        .replace(/{val2}/g, state.backlinks[i].value) + state.logMessage;
                    StateHelper.updateCopyPush(statelist, state);
                    swapped = true;
                } else {
                    state.backlinks[i].highlight = HIGHLIGHT_NONE;
                    if (i < end - 2) {
                        state.backlinks[i + 1].highlight = HIGHLIGHT_STANDARD;
                    } else if (i === end - 2) {
                        state.backlinks[end - 1].highlight = HIGHLIGHT_SORTED;
                    }
                    StateHelper.updateCopyPush(statelist, state);
                }
            }

            if (!swapped) {
                state.lineNo = 6;
                state.status = "<div>There\'s no unsorted element left.</div>";
                state.logMessage = "<div>There\'s no unsorted element left.</div>" + state.logMessage;
                StateHelper.updateCopyPush(statelist, state);
                break;
            } else {
                // Set swapped flag to run loop backward
                swapped = false;

                // Last index is already sorted
                end = end - 1;
                state.lineNo = 7;
                state.status = "<div>Element ({val}) is sorted.</div><div>Set swapped = false.</div>".replace('{val}', state.backlinks[end].value);
                state.logMessage = "<div>Element ({val}) is sorted.</div><div>Set swapped = false.</div>".replace('{val}', state.backlinks[end].value) + state.logMessage;
                StateHelper.updateCopyPush(statelist, state);
            }

            for (var i = end - 1; i > start; i--) {
                state.backlinks[i].highlight = HIGHLIGHT_STANDARD;
                state.lineNo = 8;
                state.status = "<div>Extract right unsorted element ({val})</div>".replace('{val}', state.backlinks[i].value);
                state.logMessage = "<div>Extract right unsorted element ({val})</div>".replace('{val}', state.backlinks[i].value) + state.logMessage;
                StateHelper.updateCopyPush(statelist, state);

                if (i - 1 >= start) {
                    state.backlinks[i - 1].highlight = HIGHLIGHT_SPECIAL;
                    state.lineNo = 9;
                    state.status = "<div>Checking if {val1} < {val2}</div>".replace('{val1}', state.backlinks[i].value).replace('{val2}', state.backlinks[i - 1].value);
                    state.logMessage = "<div>Checking if {val1} < {val2}</div>".replace('{val1}', state.backlinks[i].value).replace('{val2}', state.backlinks[i - 1].value);
                    StateHelper.updateCopyPush(statelist, state);
                }

                if (state.backlinks[i].value < state.backlinks[i - 1].value) {
                    EntryBacklinkHelper.swapBacklinks(state.backlinks, i, i - 1);
                    state.backlinks[i].highlight = HIGHLIGHT_NONE;
                    state.lineNo = 10;
                    if (i === start + 1) {
                        state.backlinks[start].highlight = HIGHLIGHT_SORTED;
                    }
                    state.status = "<div>{val1} < {val2}, swap positions of {val1} and {val2}</div><div>Set swapped = true</div>"
                        .replace(/{val1}/g, state.backlinks[i - 1].value)
                        .replace(/{val2}/g, state.backlinks[i].value);
                    state.logMessage = "<div>{val1} < {val2}, swap positions of {val1} and {val2}</div><div>Set swapped = true</div>"
                        .replace(/{val1}/g, state.backlinks[i - 1].value)
                        .replace(/{val2}/g, state.backlinks[i].value) + state.logMessage;
                    StateHelper.updateCopyPush(statelist, state);
                    swapped = true;
                } else {
                    state.backlinks[i].highlight = HIGHLIGHT_NONE;
                    if (i > start + 1) {
                        state.backlinks[i - 1].highlight = HIGHLIGHT_STANDARD;
                    } else if (i === start + 1) {
                        state.backlinks[start].highlight = HIGHLIGHT_SORTED;
                    }
                    StateHelper.updateCopyPush(statelist, state);
                }
            }

            // First index is already sorted
            state.lineNo = 12;
            start = start + 1;
            state.status = "<div>Element ({val}) is sorted.</div><div>Set swapped = false.</div>".replace('{val}', state.backlinks[start].value);
            state.logMessage = "<div>Element ({val}) is sorted.</div><div>Set swapped = false.</div>".replace('{val}', state.backlinks[start].value) + state.logMessage;
            StateHelper.updateCopyPush(statelist, state);
        } // End while loop

        state.status = "List sorted!";
        for (var i = 0; i < numElements; i++) {
            state.backlinks[i].highlight = HIGHLIGHT_SORTED;
        }
        state.lineNo = 0;
        StateHelper.updateCopyPush(statelist, state);

        this.play(callback);
        return true;
    }

    this.combSort = function (callback) {
        var numElements = statelist[0].backlinks.length;
        var state = StateHelper.copyState(statelist[0]);

        populatePseudocode([
            'swapped = false, gap = listLength',
            'while (swapped = true or gap != 1)',
            '  gap = gap / 1.3',
            '  swap = false',
            '  for i = 0 to listLength - gap',
            '    if gapHeadElement > gapTailElement',
            '      swap(gapHeadElement, gapTailElement)',
            '      swapped = true'
        ]);

        initLogMessage(state);

        var gap = numElements;
        var swapped = false;

        state.status = "<div>Create gap = list length (gap = {gap}), swapped = false</div>".replace('{gap}', gap);
        state.logMessage = "<div>Create gap = list length (gap = {gap}), swapped = false</div>".replace('{gap}', gap) + state.logMessage;
        state.lineNo = 1;
        StateHelper.updateCopyPush(statelist, state);

        while (swapped || gap != 1) {
            gap = Math.floor(gap / 1.3);
            if (gap < 1)
                gap = 1;
            state.status = "<div>Gap / 1.3 = {gap}, set swapped = false.</div>".replace('{gap}', gap);
            state.logMessage = "<div>Gap / 1.3 = {gap}, set swapped = false.</div>".replace('{gap}', gap) + state.logMessage;
            state.lineNo = 3;
            StateHelper.updateCopyPush(statelist, state);

            for (var i = 0; i < numElements - gap; i++) {
                state.backlinks[i].highlight = HIGHLIGHT_STANDARD;
                state.backlinks[i + gap].highlight = HIGHLIGHT_STANDARD;
                state.status = "<div>Check if {val1} > {val2}.</div>"
                    .replace('{val1}', state.backlinks[i].value)
                    .replace('{val2}', state.backlinks[i + gap].value);
                state.logMessage = "<div>Check if {val1} > {val2}.</div>"
                    .replace('{val1}', state.backlinks[i].value)
                    .replace('{val2}', state.backlinks[i + gap].value) + state.logMessage;
                state.lineNo = 6;
                StateHelper.updateCopyPush(statelist, state);

                if (state.backlinks[i].value > state.backlinks[i + gap].value) {
                    EntryBacklinkHelper.swapBacklinks(state.backlinks, i, i + gap);
                    state.status = "<div>{val1} > {val2}, swap position of ({val1}) and ({val2}). Swapped = true.</div>"
                        .replace(/{val1}/g, state.backlinks[i + gap].value)
                        .replace(/{val2}/g, state.backlinks[i].value);
                    state.logMessage = "<div>{val1} > {val2}, swap position of ({val1}) and ({val2}). Swapped = true.</div>"
                        .replace(/{val1}/g, state.backlinks[i + gap].value)
                        .replace(/{val2}/g, state.backlinks[i].value) + state.logMessage;
                    state.lineNo = [7, 8];
                    StateHelper.updateCopyPush(statelist, state);
                }

                state.backlinks[i].highlight = HIGHLIGHT_NONE;
                state.backlinks[i + gap].highlight = HIGHLIGHT_NONE;
                StateHelper.updateCopyPush(statelist, state);
            }
        }

        state.status = "<div>List sorted!</div>";
        state.logMessage = "<div>List sorted!</div>" + state.logMessage;
        for (var i = 0; i < numElements; i++) {
            state.backlinks[i].highlight = HIGHLIGHT_SORTED;
        }
        state.lineNo = 0;
        StateHelper.updateCopyPush(statelist, state);

        this.play(callback);

        return true;
    }

    this.shellSort = function (callback) {
        var numElements = statelist[0].backlinks.length;
        var state = StateHelper.copyState(statelist[0]);

        populatePseudocode([
            'create gap by half of list length',
            '  do',
            '    divide gap by 2',
            '    do',
            '      if gapHeadElement > gapTailElement',
            '        swap(gapHeadElement, gapTailElement)',
            '    while (firstIndexToGapHead\'s length < gapLength)',
            '  while (gapLength >= 1)'
        ]);

        initLogMessage(state);

        var firstRun = true;

        // Start big gap loop, then reduce gap by 1
        // You have to floor the gap, or it will get bug
        for (var gap = Math.floor(numElements / 2); gap > 0; gap = Math.floor(gap / 2)) {
            if (firstRun) {
                state.status = "<div>Create gap by diving list length in 2 (gap = {gap}).</div>".replace('{gap}', gap);
                state.logMessage = "<div>Create gap by diving list length in 2 (gap = {gap}).</div>".replace('{gap}', gap) + state.logMessage;
                state.lineNo = 1;
                StateHelper.updateCopyPush(statelist, state);
                firstRun = false;
            } else {
                state.status = "<div>Divide gap length by 2 (gap = {gap}).</div>".replace('{gap}', gap);
                state.logMessage = "<div>Divide gap length by 2 (gap = {gap}).</div>".replace('{gap}', gap) + state.logMessage;
                state.lineNo = 3;
                StateHelper.updateCopyPush(statelist, state);
            }

            for (var i = gap; i < numElements; i++) {

                for (var j = i; j >= gap;) {
                    state.backlinks[j].highlight = HIGHLIGHT_STANDARD;
                    state.backlinks[j].secondaryPositionStatus = POSITION_USE_SECONDARY_IN_DEFAULT_POSITION;
                    state.backlinks[j - gap].highlight = HIGHLIGHT_STANDARD;
                    state.backlinks[j - gap].secondaryPositionStatus = POSITION_USE_SECONDARY_IN_DEFAULT_POSITION;
                    state.status = "<div>Checking if {val1} > {val2}.</div>"
                        .replace('{val1}', state.backlinks[j - gap].value)
                        .replace('{val2}', state.backlinks[j].value);
                    state.logMessage = "<div>Checking if {val1} > {val2}.</div>"
                        .replace('{val1}', state.backlinks[j - gap].value)
                        .replace('{val2}', state.backlinks[j].value) + state.logMessage;
                    state.lineNo = 5;
                    StateHelper.updateCopyPush(statelist, state);
                    if (state.backlinks[j - gap].value > state.backlinks[j].value) {
                        EntryBacklinkHelper.swapBacklinks(state.backlinks, j, j - gap);
                        state.status = "<div>{val1} > {val2}, swap position of ({val1}) and ({val2}).</div>"
                            .replace(/{val1}/g, state.backlinks[j].value)
                            .replace(/{val2}/g, state.backlinks[j - gap].value);
                        state.logMessage = "<div>{val1} > {val2}, swap position of ({val1}) and ({val2}).</div>"
                            .replace(/{val1}/g, state.backlinks[j].value)
                            .replace(/{val2}/g, state.backlinks[j - gap].value) + state.logMessage;
                        state.lineNo = 6;
                        StateHelper.updateCopyPush(statelist, state);

                        state.backlinks[j].secondaryPositionStatus = POSITION_USE_PRIMARY;
                        state.backlinks[j - gap].secondaryPositionStatus = POSITION_USE_PRIMARY;
                        state.backlinks[j].highlight = HIGHLIGHT_NONE;
                        state.backlinks[j - gap].highlight = HIGHLIGHT_NONE;
                        StateHelper.updateCopyPush(statelist, state);
                    } else {
                        state.backlinks[j].secondaryPositionStatus = POSITION_USE_PRIMARY;
                        state.backlinks[j - gap].secondaryPositionStatus = POSITION_USE_PRIMARY;
                        state.backlinks[j].highlight = HIGHLIGHT_NONE;
                        state.backlinks[j - gap].highlight = HIGHLIGHT_NONE;
                        StateHelper.updateCopyPush(statelist, state);
                        break;
                    }
                    j -= gap;
                }
            } // End for i
        } // End for gap

        state.status = "<div>List sorted!</div>";
        state.logMessage = "<div>List sorted!</div>" + state.logMessage;
        for (var i = 0; i < numElements; i++) {
            state.backlinks[i].highlight = HIGHLIGHT_SORTED;
        }
        state.lineNo = 0;
        StateHelper.updateCopyPush(statelist, state);

        this.play(callback);

        return true;
    }

    this.mergeSort = function (callback) {
        var numElements = statelist[0].backlinks.length;
        var state = StateHelper.copyState(statelist[0]);

        populatePseudocode([
            'split each element into partitions of size 1',
            'recursively merge adjancent partitions',
            '  for i = leftPartStartIndex to rightPartLastIndex inclusive',
            '    if leftPartHeadValue <= rightPartHeadValue',
            '      copy leftPartHeadValue',
            '    else: copy rightPartHeadValue',
            'copy elements back to original array'
        ]);

        this.mergeSortSplit(state, 0, numElements);

        state.status = "<div>List sorted!</div>";
        for (var i = 0; i < numElements; i++) {
            state.backlinks[i].highlight = HIGHLIGHT_SORTED;
        }
        state.logMessage = "<div>List sorted!</div>" + state.logMessage;
        StateHelper.updateCopyPush(statelist, state);
        this.play(callback);

        return true;
    }

    this.mergeSortSplit = function (state, startIndex, endIndex) {
        if (endIndex - startIndex <= 1) {
            return;
        }

        var midIndex = Math.ceil((startIndex + endIndex) / 2);
        this.mergeSortSplit(state, startIndex, midIndex);
        this.mergeSortSplit(state, midIndex, endIndex);
        this.mergeSortMerge(state, startIndex, midIndex, endIndex);

        // Copy sorted array back to original array

        state.status = "<div>Copy sorted elements back to original array.</div>";
        state.logMessage = "<div>Copy sorted elements back to original array.</div>" + state.logMessage;

        state.lineNo = 7;

        var duplicatedArray = new Array();
        for (var i = startIndex; i < endIndex; i++) {
            var newPosition = state.backlinks[i].secondaryPositionStatus;
            duplicatedArray[newPosition] = state.backlinks[i];
        }

        for (var i = startIndex; i < endIndex; i++) {
            state.backlinks[i] = duplicatedArray[i];
        }

        for (var i = startIndex; i < endIndex; i++) {
            state.backlinks[i].secondaryPositionStatus = POSITION_USE_PRIMARY;
            state.backlinks[i].highlight = HIGHLIGHT_NONE;
            StateHelper.updateCopyPush(statelist, state);
        }
    }

    this.mergeSortMerge = function (state, startIndex, midIndex, endIndex) {
        var leftIndex = startIndex;
        var rightIndex = midIndex;

        for (var i = startIndex; i < endIndex; i++) {
            state.backlinks[i].highlight = HIGHLIGHT_STANDARD;
        }

        state.status = "<div>We now merge partitions [{partition1}] (index {startIdx1} to {endIdx1} both inclusive) and [{partition2}] (index {startIdx2} to {endIdx2} both inclusive).</div>"
            .replace('{partition1}', state.backlinks.slice(startIndex, midIndex).map(function (d) {
                return d.value;
            }))
            .replace('{startIdx1}', startIndex).replace('{endIdx1}', (midIndex - 1))
            .replace('{partition2}', state.backlinks.slice(midIndex, endIndex).map(function (d) {
                return d.value;
            }))
            .replace('{startIdx2}', midIndex).replace('{endIdx2}', (endIndex - 1));
        state.logMessage = "<div>We now merge partitions [{partition1}] (index {startIdx1} to {endIdx1} both inclusive) and [{partition2}] (index {startIdx2} to {endIdx2} both inclusive).</div>"
            .replace('{partition1}', state.backlinks.slice(startIndex, midIndex).map(function (d) {
                return d.value;
            }))
            .replace('{startIdx1}', startIndex).replace('{endIdx1}', (midIndex - 1))
            .replace('{partition2}', state.backlinks.slice(midIndex, endIndex).map(function (d) {
                return d.value;
            }))
            .replace('{startIdx2}', midIndex).replace('{endIdx2}', (endIndex - 1)) + state.logMessage;

        state.lineNo = 2;
        StateHelper.updateCopyPush(statelist, state);

        for (var i = startIndex; i < endIndex; i++) {

            if (leftIndex < midIndex && (rightIndex >= endIndex || state.backlinks[leftIndex].value <= state.backlinks[rightIndex].value)) {
                state.backlinks[leftIndex].secondaryPositionStatus = i;

                if (rightIndex < endIndex) {
                    state.status = "<div>Since {leftPart} (left partition) <= {rightPart} (right partition), we copy {leftPart} into new array.</div>"
                        .replace(/{leftPart}/g, state.backlinks[leftIndex].value).replace('{rightPart}', state.backlinks[rightIndex].value);
                    state.logMessage = "<div>Since {leftPart} (left partition) <= {rightPart} (right partition), we copy {leftPart} into new array.</div>"
                        .replace(/{leftPart}/g, state.backlinks[leftIndex].value).replace('{rightPart}', state.backlinks[rightIndex].value) + state.logMessage;
                }
                else {
                    state.status = "<div>Since right partition is empty, we copy {leftPart} (left partition) into new array.</div>".replace('{leftPart}', state.backlinks[leftIndex].value);
                    state.logMessage = "<div>Since right partition is empty, we copy {leftPart} (left partition) into new array.</div>".replace('{leftPart}', state.backlinks[leftIndex].value)
                        + state.logMessage;
                }

                state.lineNo = [3, 4, 5];

                leftIndex++;
                StateHelper.updateCopyPush(statelist, state);
            } else {
                state.backlinks[rightIndex].secondaryPositionStatus = i;

                state.lineNo = [3, 6];

                if (leftIndex < midIndex) {
                    state.status = "<div>Since {leftPart} (left partition) > {rightPart} (right partition), we copy {rightPart} into new array.</div>"
                        .replace('{leftPart}', state.backlinks[leftIndex].value).replace(/{rightPart}/g, state.backlinks[rightIndex].value);
                    state.logMessage = "<div>Since {leftPart} (left partition) > {rightPart} (right partition), we copy {rightPart} into new array.</div>"
                        .replace('{leftPart}', state.backlinks[leftIndex].value).replace(/{rightPart}/g, state.backlinks[rightIndex].value) + state.logMessage;
                }
                else {
                    state.status = "<div>Since left partition is empty, we copy {rightPart} (right partition) into new array.</div>".replace('{rightPart}', state.backlinks[rightIndex].value);
                    state.logMessage = "<div>Since left partition is empty, we copy {rightPart} (right partition) into new array.</div>".replace('{rightPart}', state.backlinks[rightIndex].value) + state.logMessage;
                }
                state.lineNo = [3, 6];

                rightIndex++;
                StateHelper.updateCopyPush(statelist, state);
            }
        }
    }

    this.radixSort = function (callback) {
        var numElements = statelist[0].backlinks.length;
        var state = StateHelper.copyState(statelist[0]);

        populatePseudocode([

        ]);

        secondaryStateList = [false];
        var currentPlacing = 1;
        var targetPlacing = 1;
        var backlinkBuckets = [[], [], [], [], [], [], [], [], [], []];

        var maxValue = d3.max(state.backlinks, function (d) {
            return d.value;
        });
        while (maxValue >= 10) {
            targetPlacing *= 10;
            maxValue = Math.floor(maxValue / 10);
        }

        for (; currentPlacing <= targetPlacing; currentPlacing *= 10) {
            for (var i = 0; i < numElements; i++) {
                state.backlinks[i].highlight = currentPlacing;
            }

            StateHelper.updateCopyPush(statelist, state);
            secondaryStateList.push(true);

            for (var i = 0; i < numElements; i++) {
                var currentDigit = Math.floor(state.backlinks[i].value / currentPlacing) % 10;
                state.backlinks[i].secondaryPositionStatus = currentDigit;
                backlinkBuckets[currentDigit].push(state.backlinks[i]);
                StateHelper.updateCopyPush(statelist, state);
                secondaryStateList.push(true);
            }

            for (var i = 0, j = 0; i <= 9;) {
                if (backlinkBuckets[i].length == 0) {
                    i++;
                    continue;
                }
                state.backlinks[j++] = backlinkBuckets[i].shift();
            }

            for (var i = 0; i < numElements; i++) {
                state.backlinks[i].secondaryPositionStatus = POSITION_USE_PRIMARY;
                StateHelper.updateCopyPush(statelist, state);
                secondaryStateList.push(true);
            }
        }

        for (var i = 0; i < numElements; i++) {
            state.backlinks[i].highlight = HIGHLIGHT_NONE;
        }
        StateHelper.updateCopyPush(statelist, state);
        secondaryStateList.push(false);

        this.play(callback);

        return true;
    }

    var drawCurrentState = function () {
        drawState(currentStep);
        if (currentStep == (statelist.length - 1)) {
            pause();
            $('#play img').attr('src', 'https://visualgo.net/img/replay.png').attr('alt', 'replay').attr('title', 'replay');
        }
        else
            $('#play img').attr('src', 'https://visualgo.net/img/play.png').attr('alt', 'play').attr('title', 'play');
    }

    var drawState = function (stateIndex) {
        if (isRadixSort) {
            drawRadixSortCanvas(statelist[stateIndex], secondaryStateList[stateIndex]);
        } else {
            drawBars(statelist[stateIndex]);
        }
        $('#status p').html(statelist[stateIndex].status);
        $('#log p').html(statelist[stateIndex].logMessage);
        highlightLine(statelist[stateIndex].lineNo);
    };

    var drawBars = function (state) {
        barWidth = width / (state.entries.length);
        scaler.domain([0, d3.max(state.entries, function (d) {
            return d.value;
        })]);

        centreBarsOffset = 0;

        var canvasData = canvas.selectAll("g").data(state.entries);

        // Exit ==============================
        var exitData = canvasData.exit()
            .remove();

        // Entry ==============================
        var newData = canvasData.enter()
            .append("g")
            .attr("transform", FunctionList.g_transform);

        newData.append("rect")
            .attr("height", 0)
            .attr("width", 0);

        newData.append("text")
            .attr("dy", ".35em")
            .attr("x", (barWidth - gapBetweenBars - 10) / 2)
            .attr("y", FunctionList.text_y)
            .text(function (d) {
                return d.value;
            });

        // Update ==============================
        canvasData.select("text")
            .transition()
            .attr("y", FunctionList.text_y)
            .text(function (d) {
                return d.value;
            });

        canvasData.select("rect")
            .transition()
            .attr("height", function (d) {
                return scaler(d.value);
            })
            .attr("width", barWidth - gapBetweenBars)
            .style("fill", function (d) {
                return d.highlight;
            });

        canvasData.transition()
            .attr("transform", FunctionList.g_transform)
    };

    var drawRadixSortCanvas = function (state, secondaryState) {
        centreBarsOffset = (1700 - (state.entries.length * 65 - 10)) / 2;
        var canvasData = radixSortCanvas.selectAll("div").data(state.entries);
        var radixSortBucket = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        radixSortBucketOrdering = new Array(state.backlinks.length);

        for (var i = 0; i < state.backlinks.length; i++) {
            if (state.backlinks.secondaryPositionStatus != POSITION_USE_PRIMARY) {
                radixSortBucketOrdering[state.backlinks[i].entryPosition] = radixSortBucket[state.backlinks[i].secondaryPositionStatus]++;
            }
        }

        // If there's step needs bucket to show
        if (secondaryState) {
            $('#radix-sort-bucket-labels').show();
        } else {
            $('#radix-sort-bucket-labels').hide();
        }

        // Exit ==============================
        var exitData = canvasData.exit()
            .remove();

        // Entry ==============================
        var newData = canvasData.enter()
            .append('div')
            .classed({ "radix-sort-element": true })
            .style({
                "left": FunctionList.radixElement_left,
                "bottom": FunctionList.radixElement_bottom
            }).html(FunctionList.radixElement_html);

        // Update ==============================
        canvasData.html(FunctionList.radixElement_html)
            .transition()
            .style({
                "left": FunctionList.radixElement_left,
                "bottom": FunctionList.radixElement_bottom
            });
    };

    this.play = function (callback) {
        issPlaying = true;
        drawCurrentState();
        animInterval = setInterval(function () {
            drawCurrentState();
            if (currentStep < (statelist.length - 1))
                currentStep++;
            else {
                clearInterval(animInterval);
                if (typeof callback == 'function') callback();
            }
        }, transitionTime);
    }

    this.pause = function () {
        issPlaying = false;
        clearInterval(animInterval);
    }

    this.replay = function () {
        issPlaying = true;
        currentStep = 0;
        drawCurrentState();
        animInterval = setInterval(function () {
            drawCurrentState();
            if (currentStep < (statelist.length - 1))
                currentStep++;
            else
                clearInterval(animInterval);
        }, transitionTime);
    }

    this.stop = function () {
        issPlaying = false;
        statelist = [statelist[0]]; //clear statelist to original state, instead of new Array();
        currentStep = 0;
        drawState(0);
        transitionTime = 750;
    }

    this.loadNumberList = function (numArray) {
        issPlaying = false;
        currentStep = 0;

        statelist = [StateHelper.createNewState(numArray)];
        secondaryStateList = [null];
        drawState(0);
        this.clearLog();
        this.clearStatus();
    }

    this.createList = function (type) {
        var numArrayMaxListSize = 15;
        var numArrayMaxElementValue = maxElementValue;
        if (isRadixSort) {
            numArrayMaxListSize = 15;
            numArrayMaxElementValue = maxRadixElementValue;
        }

        var numArray = generateRandomNumberArray(generateRandomNumber(10, numArrayMaxListSize), numArrayMaxElementValue);

        switch (type) {
            case 'random':
                break;
            case 'custom':
                numArray = $('#custom-input').val().split(",");

                if (numArray.length > numArrayMaxListSize) {
                    window.alert('List max size is ' + numArrayMaxListSize);
                    return false;
                }

                for (var i = 0; i < numArray.length; i++) {
                    var num = convertToNumber(numArray[i]);

                    if (numArray[i].trim() == "") {
                        window.alert('Missing element in custom list!');
                        return false;
                    }

                    if (isNaN(num)) {
                        window.alert('Element \"{el}\" is not number!'.replace('{el}', numArray[i].trim()));
                        return false;
                    }

                    if (num < 1 || num > numArrayMaxElementValue) {
                        window.alert('Element range must be in range from {min} to {max}'.replace('{min}', '1').replace('{max}', numArrayMaxElementValue));
                        return false;
                    }

                    numArray[i] = convertToNumber(numArray[i]);
                }
                break;
        }

        this.loadNumberList(numArray);
    }

    this.init = function () {
        this.createList('random');
        // showCodetracePanel();
        // showStatusPanel();
    }

    this.setSelectedSortFunction = function (f) {
        this.selectedSortFunction = f;
        // this.sort();
        // isRadixSort = (this.selectedSortFunction == this.radixSort);
        // isCountingSort = (this.selectedSortFunction == this.countingSort);
    }

    this.sort = function (callback) {
        return this.selectedSortFunction(callback);
    }

    this.getCurrentIteration = function () {
        return currentStep;
    }

    this.getTotalIteration = function () {
        return statelist.length;
    }

    this.forceNext = function () {
        if ((currentStep + 1) < statelist.length)
            currentStep++;
        drawCurrentState();
    }

    this.forcePrevious = function () {
        if ((currentStep - 1) >= 0)
            currentStep--;
        drawCurrentState();
    }

    this.jumpToIteration = function (n) {
        currentStep = n;
        drawCurrentState();
    }

}

var title = document.getElementById('title');

var note = document.getElementById('noteContent');

var noteTitle = document.getElementById('noteTitle');

// var gw = new Sorting();

$('#execute').click(function () {
    if (isPlaying) return;
    sort();
});

$('#create-random').click(function () {
    createList('random');
});

$('#create-custom').click(function () {
    createList('custom');
});

this.changeClass = function () {
    // $('li').removeClass('active');
    // $(this).closest('li').addClass('active');
}



$('#bubbleSort').click(function () {
    $('#viz-canvas').show();
    $('#viz-radix-sort-canvas').hide();
    isRadixSort = false;

    changeClass();

    if (!gw.issPlaying) {
        title.innerHTML = "Bubble Sort";
        changeSortType(gw.bubbleSort);
        noteTitle.innerHTML = 'Bubble Sort';
        note.innerHTML = "<div>Bubble sort, sometimes referred to as sinking sort, is a simple sorting algorithm that repeatedly steps through the list to be sorted, compares each pair of adjacent items and swaps them if they are in the wrong order. The pass through the list is repeated until no swaps are needed, which indicates that the list is sorted.</div>";

    } else {
        sort();
    }
});

$('#selectionSort').click(function () {
    $('#viz-canvas').show();
    $('#viz-radix-sort-canvas').hide();
    isRadixSort = false;
    changeClass();
    if (!gw.issPlaying) {
        title.innerHTML = "Selection Sort";
        changeSortType(gw.selectionSort);

        noteTitle.innerHTML = 'Selection Sort';
        note.innerHTML = "<div>Selection sort is a sorting algorithm, specifically an in-place comparison sort. It has O(n2) time complexity, making it inefficient on large lists, and generally performs worse than the similar insertion sort. Selection sort is noted for its simplicity, and it has performance advantages over more complicated algorithms in certain situations, particularly where auxiliary memory is limited.</div>";
    } else {
        sort();
    }
});

$('#quickSort').click(function () {
    $('#viz-canvas').show();
    $('#viz-radix-sort-canvas').hide();
    isRadixSort = false;
    changeClass();
    if (!gw.issPlaying) {
        title.innerHTML = "Quick Sort";
        changeSortType(gw.quickSort);

        noteTitle.innerHTML = 'Quick Sort';
        note.innerHTML = "<div>Quicksort (sometimes called partition-exchange sort) is an efficient sorting algorithm, serving as a systematic method for placing the elements of an array in order. Developed by Tony Hoare in 1959, with his work published in 1961, it is still a commonly used algorithm for sorting. When implemented well, it can be about two or three times faster than its main competitors, merge sort and heapsort.</div>";
    } else {
        sort();
    }
});

$('#insertionSort').click(function () {
    $('#viz-canvas').show();
    $('#viz-radix-sort-canvas').hide();
    isRadixSort = false;
    changeClass();
    if (!gw.issPlaying) {
        title.innerHTML = "Insertion Sort";
        changeSortType(gw.insertionSort);

        noteTitle.innerHTML = 'Insertion Sort';
        note.innerHTML = "<div>Insertion sort is a simple sorting algorithm that builds the final sorted array (or list) one item at a time. It is much less efficient on large lists than more advanced algorithms such as quicksort, heapsort, or merge sort.</div>";

    } else {
        sort();
    }
});

$('#cocktailSort').click(function () {
    $('#viz-canvas').show();
    $('#viz-radix-sort-canvas').hide();
    isRadixSort = false;

    if (!gw.issPlaying) {
        title.innerHTML = "Cocktail Shaker Sort";
        changeSortType(gw.cocktailShakerSort);

        noteTitle.innerHTML = 'Cocktail Shaker Sort';
        note.innerHTML = "<div>Cocktail shaker sort, also known as bidirectional bubble sort, cocktail sort, shaker sort (which can also refer to a variant of selection sort), ripple sort, shuffle sort, or shuttle sort, is a variation of bubble sort that is both a stable sorting algorithm and a comparison sort. The algorithm differs from a bubble sort in that it sorts in both directions on each pass through the list. This sorting algorithm is only marginally more difficult to implement than a bubble sort, and solves the problem of turtles in bubble sorts</div>  ";

    } else {
        sort();
    }
});

$('#combSort').click(function () {
    $('#viz-canvas').show();
    $('#viz-radix-sort-canvas').hide();
    isRadixSort = false;

    if (!gw.issPlaying) {
        title.innerHTML = "Comb Sort";
        changeSortType(gw.combSort);

        noteTitle.innerHTML = 'Comb Sort';
        note.innerHTML = "<div>Comb Sort is mainly an improvement over Bubble Sort. Bubble sort always compares adjacent values. So all inversions are removed one by one. Comb Sort improves on Bubble Sort by using gap of size more than 1. The gap starts with a large value and shrinks by a factor of 1.3 in every iteration until it reaches the value 1. Thus Comb Sort removes more than one inversion counts with one swap and performs better than Bublle Sort.</div>";

    } else {
        sort();
    }
});

$('#shellSort').click(function () {
    $('#viz-canvas').show();
    $('#viz-radix-sort-canvas').hide();
    isRadixSort = false;

    if (!gw.issPlaying) {
        title.innerHTML = "Shell Sort";
        changeSortType(gw.shellSort);

        noteTitle.innerHTML = 'Shell Sort';
        note.innerHTML = "<div>Shellsort, also known as Shell sort or Shell's method, is an in-place comparison sort. It can be seen as either a generalization of sorting by exchange (bubble sort) or sorting by insertion (insertion sort). The method starts by sorting pairs of elements far apart from each other, then progressively reducing the gap between elements to be compared.</div>";
    } else {
        sort();
    }
});

$('#mergeSort').click(function () {
    $('#viz-canvas').show();
    $('#viz-radix-sort-canvas').hide();
    isRadixSort = false;

    if (!gw.issPlaying) {
        title.innerHTML = "Merge Sort";
        changeSortType(gw.mergeSort);

        noteTitle.innerHTML = 'Merge Sort';
        note.innerHTML = "<div>In computer science, merge sort (also commonly spelled mergesort) is an efficient, general-purpose, comparison-based sorting algorithm. Most implementations produce a stable sort, which means that the implementation preserves the input order of equal elements in the sorted output. Mergesort is a divide and conquer algorithm that was invented by John von Neumann in 1945. A detailed description and analysis of bottom-up mergesort appeared in a report by Goldstine and Neumann as early as 1948.</div>";
    } else {
        sort();
    }
});

$('#radixSort').click(function () {
    $('#viz-canvas').hide();
    $('#viz-radix-sort-canvas').show();
    isRadixSort = true;

    if (!gw.issPlaying) {
        title.innerHTML = "Radix Sort";
        changeSortType(gw.radixSort);

        noteTitle.innerHTML = 'Radix Sort';
        note.innerHTML = "<div>In computer science, radix sort is a non-comparative integer sorting algorithm that sorts data with integer keys by grouping keys by the individual digits which share the same significant position and value. A positional notation is required, but because integers can represent strings of characters (e.g., names or dates) and specially formatted floating point numbers, radix sort is not limited to integers. Radix sort dates back as far as 1887 to the work of Herman Hollerith on tabulating machines.</div>";
    } else {
        sort();
    }
});

window.onload = function () {
    var reloading = sessionStorage.getItem("type");
    // gw = new Sorting();
    switch (reloading) {
        case "bubble":
            title.innerHTML = "Bubble Sort";
            gw.init();
            gw.bubbleSort();
            break;
        case "selection":
            title.innerHTML = "Selection Sort";
            gw.init();
            gw.selectionSort();
            break;
        case "quick":
            title.innerHTML = "Quick Sort";
            gw.init();
            gw.quickSort();
            break;
    }
    sessionStorage.removeItem("type");
}

function responsivefy(svg) {

    var container = d3.select(svg.node().parentNode),
        width = parseInt(svg.style("width")) + 30,
        height = parseInt(svg.style("height")),
        aspect = width / height;

    svg.attr("viewBox", "0 0 " + width + " " + height)
        .attr("preserveAspectRatio", "xMinYMid")
        .call(resize);

    d3.select(window).on("resize." + container.attr("id"), resize);

    function resize() {
        var targetWidth = parseInt(container.style("width"));
        svg.attr("width", targetWidth);
        svg.attr("height", Math.round(targetWidth / aspect));
    }
}

function changeSortType(newSortingFunction) {

    createList('random');

    if (isPlaying) stop();
    gw.clearPseudocode();
    gw.setSelectedSortFunction(newSortingFunction);
    $('#play').hide();
    sort();

}

function createList(type) {
    if (isPlaying) stop();
    setTimeout(function () {
        gw.createList(type);
        isPlaying = false;
    }, 2000);
}

function sort(callback) {
    if (isPlaying) stop();
    setTimeout(function () {
        if (gw.sort(callback)) {
            isPlaying = true;
        }
    }, 2000);
}

function convertToNumber(num) {
    return +num;
}