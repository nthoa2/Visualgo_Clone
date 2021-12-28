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

    var barWidth = 50;
    var maxHeight = 230;
    var gapBetweenBars = 5;
    var gapBetweenPrimaryAndSecondaryRows = 30; // of the bars
    var maxElementValue = 50;
    var maxRadixElementValue = 9999;


    var transitionTime = 750;
    var animInterval;
    var currentStep;
    var centreBarsOffset;
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

    var generateRandomNumber = function (min, max) { //generates a random integer between min and max
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    var generateRandomNumberArray = function (size, limit) {
        var numArray = new Array();
        for (var i = 0; i < size; i++) {
            numArray.push(generateRandomNumber(1, limit));
        }
        return numArray;
    };

    var generateRandomNumber = function (min, max) { //generates a random integer between min and max
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
            state.status = '<div>Gán vị trí cần đổi = false.</div><div>Sau đó, lặp lại từ 1 đến {endIdx} bao gồm.</div>'.replace("{endIdx}", indexOfLastUnsortedElement - 1);
            state.logMessage = '<div>Gán vị trí cần đổi = false.</div><div>Sau đó, lặp lại từ 1 đến {endIdx} bao gồm.</div>'.replace("{endIdx}", indexOfLastUnsortedElement - 1)
                + state.logMessage;
            state.lineNo = [2, 3];
            StateHelper.updateCopyPush(statelist, state);

            for (var i = 1; i < indexOfLastUnsortedElement; i++) {
                state.backlinks[i - 1].highlight = HIGHLIGHT_STANDARD;
                state.backlinks[i].highlight = HIGHLIGHT_STANDARD;

                // Kiểm tra, nếu {val1} > {val2} và hoán đổi vị trí chúng
                state.status = '<div>Kiểm tra, nếu {val1} &gt; {val2} và hoán đổi vị trí chúng</div><div>Giá trị hiện tại của swapped = {swapped}.</div>'
                    .replace("{val1}", state.backlinks[i - 1].value)
                    .replace("{val2}", state.backlinks[i].value)
                    .replace("{swapped}", swapped);
                state.logMessage = '<div>Kiểm tra, nếu {val1} &gt; {val2} và hoán đổi vị trí chúng</div><div>Giá trị hiện tại của swapped = {swapped}.</div>'
                    .replace("{val1}", state.backlinks[i - 1].value)
                    .replace("{val2}", state.backlinks[i].value)
                    .replace("{swapped}", swapped) + state.logMessage;
                state.lineNo = 4;
                StateHelper.updateCopyPush(statelist, state);

                if (state.backlinks[i - 1].value > state.backlinks[i].value) {
                    swapped = true;

                    // Hoán đổi vị tr {val1} and {val2}.
                    // Set swapped = true.
                    state.status = '<div>Hoán đổi vị trí của {val1} và {val2}.</div><div>Swapped = true.</div>'
                        .replace("{val1}", state.backlinks[i - 1].value)
                        .replace("{val2}", state.backlinks[i].value);
                    state.logMessage = '<div>Hoán đổi vị trí của {val1} và {val2}.</div><div>Swapped = true.</div>'
                        .replace("{val1}", state.backlinks[i - 1].value)
                        .replace("{val2}", state.backlinks[i].value) + state.logMessage;
                    if (this.computeInversionIndex) {
                        swapCounter++;
                        state.status += ' Đối với chỉ số nghịch đảo: Thêm 1 vào swapCounter.<div>Giá trị hiện tại của swapCounter = {swapCounter}.</div>'.replace("{swapCounter}", swapCounter);
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
                state.status = '<div>Không có sự hoán đổi nào được thực hiện trong thẻ này.</div><div>Chúng ta có thể chấm dứt tính năng Sắp xếp nổi bọt ngay bây giờ</div>';
            else {
                state.status = '<div> Phần tử cuối cùng đã được sắp xếp. </div> <div>  Chúng ta tiếp tục hoán đổi. </div>';
                state.logMessage = '<div> Phần tử cuối cùng đã được sắp xếp. </div> <div>  Chúng ta tiếp tục hoán đổi. </div>' + state.logMessage;
            }
            state.lineNo = 7;
            StateHelper.updateCopyPush(statelist, state);
        }
        while (swapped);

        for (var i = 0; i < numElements; i++)
            state.backlinks[i].highlight = HIGHLIGHT_SORTED;

        // The array/list is now sorted.
        state.status = '<div>Danh sách đã được sắp xếp !</div>';
        state.logMessage = '<div>Danh sách đã được sắp xếp !</div>' + state.logMessage;
        if (this.computeInversionIndex)
            state.status += ' Chỉ số nghịch đảo = {swapCounter}.'.replace("swapCounter", swapCounter);

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
            state.status = '<div>Lần sắp xếp {iteration}: gán {val} là giá trị nhỏ nhất hiện tại, sau đó lặp lại qua các phần tử chưa được sắp xếp còn lại để tìm ra giá trị nhỏ nhất thực sự.</div>'
                .replace("{iteration}", (i + 1))
                .replace("{val}", state.backlinks[i].value);
            state.logMessage = '<div>Lần sắp xếp {iteration}: gán {val} là giá trị nhỏ nhất hiện tại, sau đó lặp lại qua các phần tử chưa được sắp xếp còn lại để tìm ra giá trị nhỏ nhất thực sự.</div>'
                .replace("{iteration}", (i + 1))
                .replace("{val}", state.backlinks[i].value) + state.logMessage;
            state.lineNo = [1, 2, 3];
            state.backlinks[minPosition].highlight = HIGHLIGHT_SPECIAL;

            StateHelper.updateCopyPush(statelist, state);

            for (var j = i + 1; j < numElements; j++) {
                state.status = '<div>So sánh giá trị {val} có nhỏ hơn giá trị nhỏ nhất hiện tại ({minVal} ) hay không?.</div>'
                    .replace("{val}", state.backlinks[j].value)
                    .replace("{minVal}", state.backlinks[minPosition].value);
                state.logMessage = '<div>So sánh giá trị {val} có nhỏ hơn giá trị nhỏ nhất hiện tại ({minVal} ) hay không?.</div>'
                    .replace("{val}", state.backlinks[j].value)
                    .replace("{minVal}", state.backlinks[minPosition].value) + state.logMessage;
                state.lineNo = 4;
                state.backlinks[j].highlight = HIGHLIGHT_STANDARD;
                StateHelper.updateCopyPush(statelist, state);

                state.backlinks[j].highlight = HIGHLIGHT_NONE;

                if (state.backlinks[j].value < state.backlinks[minPosition].value) {
                    state.status = '<div>Gán {val} là giá trị nhỏ nhất tạm thời.</div>'
                        .replace("{val}", state.backlinks[j].value);
                    state.logMessage = '<div>Gán {val} là giá trị nhỏ nhất tạm thời.</div>'
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
                state.status = '<div>Đổi chổ giá trị nhỏ nhất hiện tại là ({minVal}) với phần tử đầu tiên (chưa được sắp xếp) ({element}).</div>'
                    .replace("{minVal}", state.backlinks[minPosition].value)
                    .replace("{element}", state.backlinks[i].value);
                state.logMessage = '<div>Đổi chổ giá trị nhỏ nhất hiện tại là ({minVal}) với phần tử đầu tiên (chưa được sắp xếp) ({element}).</div>'
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
                state.status = '<div>Vì là phần tử nhỏ nhất ở đầu nên không cần hoán đổi.</div>';
                state.logMessage = '<div>Vì là phần tử nhỏ nhất ở đầu nên không cần hoán đổi.</div>' + state.logMessage;
                state.lineNo = 6;
                StateHelper.updateCopyPush(statelist, state);
            }

            // {val} is now considered sorted.
            state.status = '<div>{val} hiện giờ được coi là đã sắp xếp.</div>'.replace("{val}", state.backlinks[i].value);
            state.logMessage = '<div>{val} hiện được coi là đã sắp xếp.</div>'.replace("{val}", state.backlinks[i].value) + state.logMessage;
            state.backlinks[minPosition].highlight = HIGHLIGHT_NONE;
            state.backlinks[i].highlight = HIGHLIGHT_SORTED;
            StateHelper.updateCopyPush(statelist, state);
        }

        for (var i = 0; i < numElements; i++)
            state.backlinks[i].highlight = HIGHLIGHT_SORTED; // highlight everything
        // The array/list is now sorted.
        // (After all iterations, the last element will naturally be sorted.)
        state.status = 'Danh sách đã được sắp xếp !' + '<br>' + '(Sau tất cả các lần lặp lại, phần tử cuối cùng sẽ được sắp xếp một cách tự động.)';
        state.logMessage = "<div>Danh sách đã được sắp xếp !</div>" + state.logMessage;
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
        state.status = '<div>Danh sách đã được sắp xếp !</div>';
        state.logMessage = '<div>Danh sách đã được sắp xếp !</div>' + state.logMessage;

        for (var i = 0; i < numElements; i++)
            state.backlinks[i].highlight = HIGHLIGHT_SORTED; //unhighlight everything
        StateHelper.updateCopyPush(statelist, state);
    }

    var quickSortSplit = function (state, startIndex, endIndex) { //startIndex & endIndex bao gồm
        state.status = '<div>Thao tác trên phân vùng [{partition}] bao gồm (index {startIndex} to {endIndex} ).</div>'
            .replace("{partition}", state.backlinks.slice(startIndex, endIndex + 1).map(function (d) {
                return d.value;
            }))
            .replace("{startIndex}", startIndex).replace("{endIndex}", endIndex);
        state.logMessage = '<div>Thao tác trên phân vùng [{partition}] bao gồm (index {startIndex} to {endIndex} ).</div>'
            .replace("{partition}", state.backlinks.slice(startIndex, endIndex + 1).map(function (d) {
                return d.value;
            }))
            .replace("{startIndex}", startIndex).replace("{endIndex}", endIndex) + state.logMessage;
        state.lineNo = 1;

        if (startIndex > endIndex)
            return;

        if (startIndex == endIndex) {
            state.status += '<div>Kể từ khi kích thước phân vùng == 1, phần tử bên trong phân vùng cần phải ở vị trí sắp xếp.</div>';
            state.logMessage += '<div>Kể từ khi kích thước phân vùng == 1, phần tử bên trong phân vùng cần phải ở vị trí sắp xếp.</div>' + state.logMessage;
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

            state.status += '<div>Được lựa chọn ngẫu nhiên {pivot} (index {index}) là pivot.</div>'
                .replace("{pivot}", state.backlinks[pivotIndex].value)
                .replace("{index}", pivotIndex);
            state.logMessage += '<div>Được lựa chọn ngẫu nhiên {pivot} (index {index}) là pivot.</div>'
                .replace("{pivot}", state.backlinks[pivotIndex].value)
                .replace("{index}", pivotIndex) + state.logMessage;
            state.lineNo = [1, 2];

            state.backlinks[pivotIndex].highlight = HIGHLIGHT_PIVOT;
            StateHelper.updateCopyPush(statelist, state);

            if (pivotIndex != startIndex) {
                state.status = '<div>Hoán đổi pivot ({pivot}}, index {index}) với phần tử đầu tiên ({first}, index {firstIndex}). (storeIndex = {storeIndex}.)</div>'
                    .replace("{pivot}", state.backlinks[pivotIndex].value)
                    .replace("{index}", pivotIndex)
                    .replace("{first}", state.backlinks[startIndex].value)
                    .replace("{firstIndex}", startIndex)
                    .replace("{storeIndex}", (startIndex + 1));
                state.logMessage = '<div>Hoán đổi pivot ({pivot}}, index {index}) với phần tử đầu tiên ({first}, index {firstIndex}). (storeIndex = {storeIndex}.)</div>'
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

            state.status += '<div>Chọn {pivot} là pivot. (storeIndex = {storeIndex}.)</div>'
                .replace("{pivot}", state.backlinks[pivotIndex].value)
                .replace("{storeIndex}", (startIndex + 1));
            state.logMessage += '<div>Chọn {pivot} là pivot. (storeIndex = {storeIndex}.)</div>'
                .replace("{pivot}", state.backlinks[pivotIndex].value)
                .replace("{storeIndex}", (startIndex + 1)) + state.logMessage;

            state.lineNo = [1, 2, 3];

            state.backlinks[pivotIndex].highlight = HIGHLIGHT_PIVOT;
            StateHelper.updateCopyPush(statelist, state);
        }

        var storeIndex = pivotIndex + 1;
        var pivotValue = state.backlinks[pivotIndex].value;

        for (var i = storeIndex; i <= endIndex; i++) {
            state.status = '<div>Kiểm tra, nếu {val} < {pivot} (pivot).</div>'
                .replace("{val}", state.backlinks[i].value)
                .replace("{pivot}", pivotValue);
            state.logMessage = '<div>Kiểm tra, nếu {val} < {pivot} (pivot).</div>'
                .replace("{val}", state.backlinks[i].value)
                .replace("{pivot}", pivotValue) + state.logMessage;
            state.lineNo = [4, 5];

            state.backlinks[i].highlight = HIGHLIGHT_SPECIAL;
            StateHelper.updateCopyPush(statelist, state);
            if (state.backlinks[i].value < pivotValue) {

                state.status = '<div>{val} < {pivot} (pivot) là true. <div>Hoán đổi vị trí {idx} (value = {valI}) với phần tử tại vị trí storeIndex (index = {storeIdx}, giá trị = {storeVal}).</div> (Giá trị sau khi hoán đổi là  = {newStoreIdx}).</div>'
                    .replace("{idx}", i)
                    .replace("{val}", state.backlinks[i].value)
                    .replace("{valI}", state.backlinks[i].value)
                    .replace("{pivot}", pivotValue)
                    .replace("{storeIdx}", storeIndex)
                    .replace("{storeVal}", state.backlinks[storeIndex].value)
                    .replace("{newStoreIdx}", (storeIndex + 1));
                state.logMessage = '<div>{val} < {pivot} (pivot) là true. <div>Hoán đổi vị trí {idx} (value = {valI}) với phần tử tại vị trí storeIndex (index = {storeIdx}, giá trị = {storeVal}).</div> (Giá trị sau khi hoán đổi là  = {newStoreIdx}).</div>'
                    .replace("{idx}", i)
                    .replace("{val}", state.backlinks[i].value)
                    .replace("{valI}", state.backlinks[i].value)
                    .replace("{pivot}", pivotValue)
                    .replace("{storeIdx}", storeIndex)
                    .replace("{storeVal}", state.backlinks[storeIndex].value)
                    .replace("{newStoreIdx}", (storeIndex + 1)) + state.logMessage;

                state.lineNo = [4, 6];

                if (i != storeIndex) {
                    state.logMessage = '<div>Hoán đổi {val1} và {val2}</div>'
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
        state.status = '<div>Quá trình lặp lại hoàn tất.</div>';
        state.logMessage = '<div>Quá trình lặp lại hoàn tất.</div>' + state.logMessage;
        state.lineNo = 4;
        StateHelper.updateCopyPush(statelist, state);
        if (storeIndex - 1 != pivotIndex) {
            state.status = '<div>Hoán đổi pivot (index = {pivotIdx}, giá trị = {pivot}) với phần tử tại storeIndex - 1 (index = {newIdx}, giá trị = {newVal}).</div>'
                .replace("{pivotIdx}", pivotIndex)
                .replace("{pivot}", pivotValue)
                .replace("{newIdx}", (storeIndex - 1))
                .replace("{newVal}", state.backlinks[storeIndex - 1].value);
            state.logMessage = '<div>Hoán đổi pivot (index = {pivotIdx}, giá trị = {pivot}) với phần tử tại storeIndex - 1 (index = {newIdx}, giá trị = {newVal}).</div>'
                .replace("{pivotIdx}", pivotIndex)
                .replace("{pivot}", pivotValue)
                .replace("{newIdx}", (storeIndex - 1))
                .replace("{newVal}", state.backlinks[storeIndex - 1].value) + state.logMessage;

            state.lineNo = 7;
            EntryBacklinkHelper.swapBacklinks(state.backlinks, storeIndex - 1, pivotIndex);
            StateHelper.updateCopyPush(statelist, state);
        }
        state.status = '<div>Pivot hiện đang ở vị trí được sắp xếp của nó.</div>';
        state.logMessage = '<div>Pivot hiện đang ở vị trí được sắp xếp của nó.</div>' + state.logMessage;
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
        state.status = "<div>Đánh dấu phần tử đầu tiên({first}) đã sắp xếp</div>"
            .replace('{first}', state.backlinks[0].value);
        state.logMessage = "<div>Đánh dấu phần tử đầu tiên({first}) đã sắp xếp</div>"
            .replace('{first}', state.backlinks[0].value) + state.logMessage;
        state.backlinks[0].highlight = HIGHLIGHT_SORTED;
        state.lineNo = 1;
        StateHelper.updateCopyPush(statelist, state);

        // Start loop forward
        for (var i = 1; i < numElements; i++) {
            state.backlinks[i].highlight = HIGHLIGHT_SPECIAL;
            state.lineNo = [2, 3];
            state.status = "<div>Lấy ra phần tử  đầu tiên chưa được sắp xếp ({val}).</div>"
                .replace('{val}', state.backlinks[i].value);
            state.logMessage = "<div>Lấy ra phần tử  đầu tiên chưa được sắp xếp ({val}).</div>"
                .replace('{val}', state.backlinks[i].value) + state.logMessage;
            StateHelper.updateCopyPush(statelist, state);
            state.backlinks[i].secondaryPositionStatus = POSITION_USE_SECONDARY_IN_DEFAULT_POSITION;

            // Start loop backward from i index
            for (var j = (i - 1); j >= 0; j--) {
                state.backlinks[j].highlight = HIGHLIGHT_STANDARD;
                state.lineNo = 4;
                state.status = "<div>Tìm vị trí để chèn phần tử vừa lấy ra, so sánh với phần tử đã được sắp xếp {val}.</div>".replace('{val}', state.backlinks[j].value);
                state.logMessage = "<div>Tìm vị trí để chèn phần tử vừa lấy ra, so sánh với phần tử đã được sắp xếp {val}.</div>".replace('{val}', state.backlinks[j].value) + state.logMessage;
                StateHelper.updateCopyPush(statelist, state);
                if (state.backlinks[j].value > state.backlinks[j + 1].value) {
                    // Swap
                    state.backlinks[j].highlight = HIGHLIGHT_SORTED;
                    state.lineNo = [5, 6];
                    state.status = "<div>{val1} > {val2} là true, do đó di chuyển phần tử được sắp xếp hiện tại ({val}) sang bên phải 1.</div>"
                        .replace('{val1}', state.backlinks[j].value)
                        .replace('{val2}', state.backlinks[j + 1].value)
                        .replace('{val}', state.backlinks[j].value);
                    state.logMessage = "<div>{val1} > {val2} là true, do đó di chuyển phần tử được sắp xếp hiện tại ({val}) sang bên phải 1.</div>"
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
                    state.status = "<div>{val1} > {val2} là false, giữ nguyên phần tử ở vị trí hiện tại.</div>"
                        .replace('{val1}', state.backlinks[j].value)
                        .replace('{val2}', state.backlinks[j + 1].value);
                    state.logMessage = "<div>{val1} > {val2} là false, giữ nguyên phần tử ở vị trí hiện tại.</div>"
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
        state.status = "<div>Danh sách đã được sắp xếp !</div>";
        state.logMessage = "<div>Danh sách đã được sắp xếp !</div>" + state.logMessage;
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
                    state.status = "<div>Kiểm tra, nếu {val1} > {val2}.</div>".replace('{val1}', state.backlinks[i].value).replace('{val2}', state.backlinks[i + 1].value);
                    state.logMessage = "<div>Kiểm tra, nếu {val1} > {val2}.</div>".replace('{val1}', state.backlinks[i].value).replace('{val2}', state.backlinks[i + 1].value) + state.logMessage;
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
                    state.status = "<div>Kiểm tra, nếu {val1} < {val2}</div>".replace('{val1}', state.backlinks[i].value).replace('{val2}', state.backlinks[i - 1].value);
                    state.logMessage = "<div>Kiểm tra, nếu {val1} < {val2}</div>".replace('{val1}', state.backlinks[i].value).replace('{val2}', state.backlinks[i - 1].value);
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

        state.status = "Danh sách đã được sắp xếp !";
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

        state.status = "<div>Danh sách đã được sắp xếp !</div>";
        state.logMessage = "<div>Danh sách đã được sắp xếp !</div>" + state.logMessage;
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
                    state.status = "<div>Kiểm tra, nếu {val1} > {val2}.</div>"
                        .replace('{val1}', state.backlinks[j - gap].value)
                        .replace('{val2}', state.backlinks[j].value);
                    state.logMessage = "<div>Kiểm tra, nếu {val1} > {val2}.</div>"
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

        state.status = "<div>Danh sách đã được sắp xếp !</div>";
        state.logMessage = "<div>Danh sách đã được sắp xếp !</div>" + state.logMessage;
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
            '  for i = leftPartStartIndex to rightPartLastIndex bao gồm',
            '    if leftPartHeadValue <= rightPartHeadValue',
            '      copy leftPartHeadValue',
            '    else: copy rightPartHeadValue',
            'copy elements back to original array'
        ]);

        this.mergeSortSplit(state, 0, numElements);

        state.status = "<div>Danh sách đã được sắp xếp !</div>";
        for (var i = 0; i < numElements; i++) {
            state.backlinks[i].highlight = HIGHLIGHT_SORTED;
        }
        state.logMessage = "<div>Danh sách đã được sắp xếp !</div>" + state.logMessage;
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
        state.status = "<div>Đưa các phần tử đã sắp xếp vào lại mảng ban đầu.</div>";
        state.logMessage = "<div>Đưa các phần tử đã sắp xếp vào lại mảng ban đầu.</div>" + state.logMessage;
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

        state.status = "<div>Giờ chúng ta gộp phân vùng [{partition1}] bao gồm (index {startIdx1} đến {endIdx1}  ) và [{partition2}] bao gồm (index {startIdx2} đến {endIdx2} ).</div>"
            .replace('{partition1}', state.backlinks.slice(startIndex, midIndex).map(function (d) {
                return d.value;
            }))
            .replace('{startIdx1}', startIndex).replace('{endIdx1}', (midIndex - 1))
            .replace('{partition2}', state.backlinks.slice(midIndex, endIndex).map(function (d) {
                return d.value;
            }))
            .replace('{startIdx2}', midIndex).replace('{endIdx2}', (endIndex - 1));
        state.logMessage = "<div>Giờ chúng ta gộp phân vùng [{partition1}] bao gồm (index {startIdx1} đến {endIdx1} ) và [{partition2}] bao gồm (index {startIdx2} đến {endIdx2} ).</div>"
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
                    state.status = "<div>Ta thấy {leftPart} <= {rightPart} ,    sao chép {leftPart}(phần tử bên trái) vào trong mảng mới</div>"
                        .replace(/{leftPart}/g, state.backlinks[leftIndex].value).replace('{rightPart}', state.backlinks[rightIndex].value);
                    state.logMessage = "<div>Ta thấy {leftPart} <= {rightPart} , sao chép {leftPart} (phần tử bên trái) vào trong mảng mới</div>"
                        .replace(/{leftPart}/g, state.backlinks[leftIndex].value).replace('{rightPart}', state.backlinks[rightIndex].value) + state.logMessage;
                }
                else {
                    state.status = "<div>Vì phân vùng bên phải trống, chúng ta sao chép {leftPart} (phần tử bên trái) vào trong mảng mới</div>".replace('{leftPart}', state.backlinks[leftIndex].value);
                    state.logMessage = "<div>Vì phân vùng bên phải trống, chúng ta sao chép {leftPart} (phần tử bên trái) vào trong mảng mới</div>".replace('{leftPart}', state.backlinks[leftIndex].value)
                        + state.logMessage;
                }
                state.lineNo = [3, 4, 5];
                leftIndex++;
                StateHelper.updateCopyPush(statelist, state);
            } else {
                state.backlinks[rightIndex].secondaryPositionStatus = i;
                state.lineNo = [3, 6];
                if (leftIndex < midIndex) {
                    state.status = "<div>Ta thấy {leftPart}  > {rightPart} ,  sao chép {rightPart} (phần tử bên phải) vào trong mảng mới</div>"
                        .replace('{leftPart}', state.backlinks[leftIndex].value).replace(/{rightPart}/g, state.backlinks[rightIndex].value);
                    state.logMessage = "<div>Ta thấy {leftPart}  > {rightPart} , sao chép {rightPart} (phần tử bên phải) vào trong mảng mới</div>"
                        .replace('{leftPart}', state.backlinks[leftIndex].value).replace(/{rightPart}/g, state.backlinks[rightIndex].value) + state.logMessage;
                }
                else {
                    state.status = "<div>Vì phân vùng bên trái rỗng, chúng ta sao chép {rightPart} (phần tử bên phải) vào trong mảng mới</div>".replace('{rightPart}', state.backlinks[rightIndex].value);
                    state.logMessage = "<div>Vì phân vùng bên trái rỗng, chúng ta sao chép {rightPart} (phần tử bên phải) vào trong mảng mới</div>".replace('{rightPart}', state.backlinks[rightIndex].value) + state.logMessage;
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

        populatePseudocode([]);
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
    //* Bug with sidebarOpenList temp disable
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
        note.innerHTML = "<div>Sắp xếp nổi bọt, đôi khi được gọi là sắp xếp chìm, là một thuật toán sắp xếp đơn giản lặp đi lặp lại các bước qua danh sách được sắp xếp, so sánh từng cặp mục liền kề và hoán đổi chúng nếu chúng không đúng thứ tự. Việc chuyển qua danh sách được lặp lại cho đến khi không cần hoán đổi, điều này cho biết rằng danh sách đã được sắp xếp.</div>";
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
        note.innerHTML = "<div>Sắp xếp chọn là một thuật toán sắp xếp, cụ thể là sắp xếp so sánh tại chỗ. Nó có độ phức tạp về thời gian là O (n2), làm cho nó không hiệu quả trên các danh sách lớn và thường hoạt động kém hơn so với loại chèn tương tự. Sắp xếp lựa chọn được chú ý vì tính đơn giản của nó và nó có lợi thế về hiệu suất so với các thuật toán phức tạp hơn trong một số trường hợp nhất định, đặc biệt khi bộ nhớ phụ bị hạn chế.</div>";
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
        note.innerHTML = "<div>Sắp xếp nhanh (đôi khi được gọi là sắp xếp trao đổi phân vùng) là một thuật toán sắp xếp hiệu quả, phục vụ như một phương pháp có hệ thống để sắp xếp các phần tử của một mảng theo thứ tự. Được phát triển bởi Tony Hoare vào năm 1959, với công trình của ông được xuất bản vào năm 1961, nó vẫn là một thuật toán được sử dụng phổ biến để sắp xếp. Khi được triển khai tốt, nó có thể nhanh hơn khoảng hai hoặc ba lần so với các đối thủ cạnh tranh chính của nó, sắp xếp hợp nhất và sắp xếp theo thứ tự.</div>";
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
        note.innerHTML = "<div>Sắp xếp chèn là một thuật toán sắp xếp đơn giản xây dựng mảng (hoặc danh sách) được sắp xếp cuối cùng một mục tại một thời điểm. Nó kém hiệu quả hơn nhiều trên các danh sách lớn so với các thuật toán nâng cao hơn như quicksort, heapsort hoặc merge sort.</div>";
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
        note.innerHTML = "<div>Trong khoa học máy tính, sắp xếp trộn (cũng thường được đánh vần là mergesort) là một thuật toán sắp xếp hiệu quả, có mục đích chung, dựa trên so sánh. Hầu hết các triển khai tạo ra một sắp xếp ổn định, có nghĩa là việc triển khai bảo toàn thứ tự đầu vào của các phần tử bằng nhau trong đầu ra được sắp xếp. Mergesort là một thuật toán chia và chinh phục được John von Neumann phát minh vào năm 1945. Mô tả và phân tích chi tiết về hợp nhất từ dưới lên đã xuất hiện trong một báo cáo của Goldstine và Neumann vào đầu năm 1948.</div>";
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