function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable)
            return decodeURIComponent(pair[1]);
    }
    return "";
}

$('#status').bind("DOMSubtreeModified", function () {
    $('#console').append($('#status').html());
});

function clearConsole(callback) {
    $('#console').html('');
}
// List Widget
// original author: Steven Kester Yuwono, then cleaned and maintained by Steven Halim

var BACK_EDGE_CONST = 5000;

var List = function () {
    var self = this;
    var graphWidget = new GraphWidget();
    var activeStatus = "list";
    var maxSize = 10;
    var maxStackSize = 7;

    var valueRange = [1, 99]; // Range of valid values of List vertexes allowed
    var maxHeightAllowed = 10;

    var initialArray = [15, 6, 23, 4, 7, 71, 5, 50];
    var initialStackArray = [15, 6, 50, 4];

    /*
     * iL: Internal representation of List in this object
     * The keys are the text of the vertices, and the value is the attributes of the corresponding vertex encapsulated in a JS object, which are:
     * - "prev": text of the prev vertex. If the vertex is root Vertex, the value is null
     * - "next": text of the right child. No child -> null
     * - "cx": X-coordinate of center of the vertex
     * - "cy": Y-coordinate of center of the vertex
     * - "height": height of the Vertex. Height of root is 0
     * - "vtxIdx": Vertex class number of the corresponding Vertex
     *
     * In addition, there is a key called "head" in iL, containing the text of the root Vertex.
     * If List is empty, root is null.
     */

    var iL = {};
    var amountVertex = 0;
    var vertexClassNumberCounter = 9;
    iL["head"] = null;

    init(generateRandomArray(Math.floor((Math.random() * 5 + 3))));

    this.setActiveStatus = function (newActiveStatus) {
        if (activeStatus != newActiveStatus) {
            clearScreen();
            activeStatus = newActiveStatus;
            init(generateRandomArray(Math.floor((Math.random() * 5 + 3))));
        }
    }

    this.getActiveStatus = function () {
        return activeStatus;
    }

    this.widgetRecalculatePosition = function () {
        recalculatePosition();
    }

    this.getGraphWidget = function () {
        return graphWidget;
    }

    /* FIRST MENU: Create */

    this.generate = function (initArr) {
        init(initArr);
    }

    function generateRandomArray(vertexAmt) {
        var initArr = new Array();
        while (initArr.length < vertexAmt) {
            var random = Math.floor(1 + Math.random() * 98);
            if ($.inArray(random, initArr) < 0)
                initArr.push(random);
        }
        return initArr;
    }

    this.generateRandom = function (isSorted) {
        var initArr = generateRandomArray(Math.floor((Math.random() * 5 + 3))); // [3..7]
        if (isSorted) initArr.sort(function (a, b) {
            return a - b;
        }); // sort it first
        init(initArr);
        return true;
    };

    this.generateRandomFixedSize = function (val) {
        if (activeStatus == "stack") {
            if (val > maxStackSize) {
                $('#create-err').html('Xin lỗi, số đỉnh cho phép tối đa là {maxSize}'.replace("{maxSize}", maxStackSize));
                return false;
            }
        }
        else {
            if (val > maxSize) {
                $('#create-err').html('Xin lỗi, số đỉnh cho phép tối đa là {maxSize}'.replace("{maxSize}", maxSize));
                return false;
            }
        }
        var initArr = generateRandomArray(val);
        init(initArr);
        return true;
    }

    this.generateUserDefined = function (vertexTextArr) {
        var vertexAmt = vertexTextArr.length;
        if (activeStatus == "stack") {
            if (vertexAmt > maxStackSize) {
                $('#create-err').html('Xin lỗi, số đỉnh cho phép tối đa là {maxSize}'.replace("{maxSize}", maxStackSize));
                return false;
            }
        }
        else {
            if (vertexAmt > maxSize) {
                $('#create-err').html('Xin lỗi, số đỉnh cho phép tối đa là {maxSize}'.replace("{maxSize}", maxSize));
                return false;
            }
        }

        if (vertexTextArr == '') { // prevent creation of empty list
            $('#create-err').html('Xin lỗi, số đỉnh tối thiểu là 1.');
            return false;
        }

        var initArr = new Array();
        for (i = 0; i < vertexTextArr.length; i++) {
            var vt = parseInt(vertexTextArr[i]);
            if (!isNaN(vt) && $.inArray(vt, initArr) < 0) // remove duplicates
                initArr.push(vt);
        }
        init(initArr);
        return true;
    }

    this.getA = function () {
        var theArr = [], currentVertex = iL["head"];
        while (currentVertex != null) {
            theArr.push(currentVertex);
            currentVertex = iL[currentVertex]["next"];
        }
        return theArr;
    }

    /* SECOND MENU: Search (LL, DLL) or Peek (Stack, Queue, Deque -- additional Peek back) */

    this.search = function (val, callback) {
        var stateList = [], vertexTraversed = {}, edgeTraversed = {}, currentVertex = iL["head"],
            cs = createState(iL), curVtxIdx, key, index = 0;

        if (currentVertex == null) {
            cs = createState(iL, vertexTraversed, edgeTraversed);
            // Danh sách liên kết hiện tại trống, chúng ta trả về NOT_FOUND.
            cs["status"] = 'Danh sách liên kết hiện tại trống, chúng ta trả về NOT_FOUND.';
            cs["lineNo"] = 1;
            stateList.push(cs);
        }
        else {
            // temp = head, index = 0
            cs = createState(iL, vertexTraversed, edgeTraversed);
            curVtxIdx = iL[currentVertex]["vtxIdx"];
            cs["vl"][curVtxIdx]["state"] = VERTEX_HIGHLIGHTED;
            cs["vl"][curVtxIdx]["extratext"] = curVtxIdx + (curVtxIdx == 0 ? "/head" : (iL[currentVertex]["next"] == null ? "/tail" : "")) + "/temp";
            // Đây là danh sách liên kết hiện tại.
            // Chúng ta muốn tìm kiếm giá trị v = {val} bắt đầu từ head (index 0).
            cs["status"] = 'Đây là danh sách liên kết hiện tại.<br>Chúng ta muốn tìm kiếm giá trị v = {val} bắt đầu từ head (index 0).'.replace("{val}", val);
            cs["lineNo"] = 2;
            stateList.push(cs);

            // while (temp.data != input)
            while (parseInt(currentVertex) != parseInt(val)) {
                vertexTraversed[currentVertex] = true;
                cs = createState(iL, vertexTraversed, edgeTraversed);
                // Comparing {currentVertex} with {val} (index = {index}).
                // {currentVertex} is not equal to {val} so we have to continue.
                cs["status"] = 'So sánh {currentVertex} (index = {index}) với v = {val}.<br>Ta thấy {currentVertex} không bằng {val} vì vậy ta tiếp tục so sánh.'.replace("{currentVertex}", currentVertex).replace("{val}", val).replace("{index}", index).replace("{currentVertex}", currentVertex).replace("{val}", val);
                cs["vl"][curVtxIdx]["extratext"] = curVtxIdx + (curVtxIdx == 0 ? "/head" : (iL[currentVertex]["next"] == null ? "/tail" : "")) + "/temp";
                cs["lineNo"] = 3;
                stateList.push(cs);

                // case when vertex is not found
                currentVertex = iL[currentVertex]["next"];
                if (currentVertex == null) {
                    // temp = temp.next, index++
                    cs = createState(iL, vertexTraversed, edgeTraversed);
                    // We try advancing temp to the next vertex.
                    // But...
                    cs["status"] = 'Chúng ta đã cố gắng tìm kiếm.<br>Nhưng...';
                    cs["lineNo"] = 4;
                    stateList.push(cs);
                    cs = createState(iL, vertexTraversed, edgeTraversed);
                    cs["status"] = 'Temp = null, chúng ta đã duyệt hết danh sách.<br>Có vẻ như giá trị v = {val} bạn muốn tìm không tồn tại trong Danh sách liên kết.'.replace("{val}", val);
                    cs["lineNo"] = [5, 6];
                    stateList.push(cs);
                    break;
                }

                curVtx = iL[currentVertex]["prev"];
                curVtxIdx = iL[currentVertex]["vtxIdx"];
                var edgeHighlighted = iL[curVtx]["vtxIdx"];
                edgeTraversed[edgeHighlighted] = true;
                if ((activeStatus == "doublylist") || (activeStatus == "deque"))
                    edgeTraversed[edgeHighlighted + BACK_EDGE_CONST] = true;
                cs = createState(iL, vertexTraversed, edgeTraversed);
                cs["vl"][curVtxIdx]["state"] = VERTEX_HIGHLIGHTED;
                cs["vl"][curVtxIdx]["extratext"] = curVtxIdx + (curVtxIdx == 0 ? "/head" : (iL[currentVertex]["next"] == null ? "/tail" : "")) + "/temp";
                cs["el"][edgeHighlighted]["animateHighlighted"] = true;
                cs["el"][edgeHighlighted]["state"] = EDGE_TRAVERSED;
                cs["status"] = 'Đi đến đỉnh tiếp theo.<br> Tiếp tục tìm kiếm !.';
                cs["lineNo"] = [4, 5];
                stateList.push(cs);
                index++;
            }

            // case when vertex is found
            if (currentVertex != null) {
                // return index
                cs = createState(iL, vertexTraversed, edgeTraversed);
                curVtxIdx = iL[currentVertex]["vtxIdx"];
                cs["vl"][curVtxIdx]["state"] = VERTEX_HIGHLIGHTED;
                cs["vl"][curVtxIdx]["extratext"] = curVtxIdx + (curVtxIdx == 0 ? "/head" : (iL[currentVertex]["next"] == null ? "/tail" : "")) + "/temp";
                cs["status"] = 'Giá trị v = {val} được tìm thấy tại chỉ mục (index = {index}).<br>Độ phức tạp là O(N).'.replace("{val}", val).replace("{index}", index);
                cs["lineNo"] = 7;
                stateList.push(cs);
            }
        }
        graphWidget.startAnimation(stateList, callback);
        populatePseudocode(4);
        return true;
    };

    this.peek = function (isHead, callback) {
        var stateList = [], vertexTraversed = {}, edgeTraversed = {}, currentVertex = iL["head"],
            cs = createState(iL), curVtxIdx, key, index = 0;
        if (currentVertex == null) {
            cs = createState(iL, vertexTraversed, edgeTraversed);
            cs["status"] = 'Danh sách liên kết hiện tại trống, chúng ta trả về NOT_FOUND.';
            cs["lineNo"] = 1;
            stateList.push(cs);
        }
        else {
            if (!isHead) {
                while (true) { // go to tail
                    if (iL[currentVertex]["next"] != null) currentVertex = iL[currentVertex]["next"];
                    else break;
                }
            }
            cs = createState(iL, vertexTraversed, edgeTraversed);
            curVtxIdx = iL[currentVertex]["vtxIdx"];
            cs["vl"][curVtxIdx]["state"] = VERTEX_HIGHLIGHTED;
            cs["status"] = (isHead ? 'Trả về giá trị được lưu trữ ở head: {currentVertex}.' : 'Trả về giá trị được lưu trữ ở tail: {currentVertex}.').replace("{currentVertex}", currentVertex);
            cs["lineNo"] = 2;
            stateList.push(cs);
        }
        graphWidget.startAnimation(stateList, callback);
        populatePseudocode(isHead ? 3 : 9);
        return true;
    }

    /* THIRD MENU: Insert (LL, DLL, minor differences only)/Push (Stack)/Enqueue (Queue, Deque) */
    this.insertHead = function (v, callback) {
        var val = parseInt(v);
        var tempinternalList = deepCopy(iL);

        // 1. Check whether value is number
        if (isNaN(val)) {
            $('#insert-err').html('Vui lòng chỉ nhập số nguyên');
            return false;
        }
        // 2. No duplicates allowed. Also works if more than one similar value are inserted
        if (tempinternalList[val] != null) {
            $('#insert-err').html('Không cho phép đỉnh trùng lặp!');
            if (typeof callback == 'function') callback();
            return false;
        }
        // 3. Check range
        if (parseInt(val) < valueRange[0] || parseInt(val) > valueRange[1]) {
            $('#insert-err').html('Xin lỗi, chỉ những giá trị giữa {range0} và {range1} mới có thể chèn.'.replace("{range0}", valueRange[0]).replace("{range1}", valueRange[1]));
            return false;
        }
        // 4. check size
        if (activeStatus == "stack") {
            if (amountVertex >= maxStackSize) {
                $('#insert-err').html('Xin lỗi, kích thước tối đa là {maxSize}.'.replace("{maxSize}", maxStackSize));
                return false;
            }
        }
        else {
            if (amountVertex >= maxSize) {
                $('#insert-err').html('Xin lỗi, kích thước tối đa là {maxSize}.'.replace("{maxSize}", maxSize));
                return false;
            }
        }

        var stateList = [], vertexTraversed = {}, edgeTraversed = {}, currentVertex = iL["head"], cs = {},
            curVtxIdx;
        if (amountVertex >= 1) cs = createState(iL);
        else cs = {};
        // Begin insertion, first, update internal representation
        iL[parseInt(val)] = {
            "next": null,
            "vtxIdx": vertexClassNumberCounter++
        };

        // modified this part for linked list insertion
        var newVtx = parseInt(val);
        var oldHeadIdx;
        iL[newVtx]["cx"] = 50;
        iL[newVtx]["cy"] = 120;

        // if linked list is empty
        amountVertex++;
        if (amountVertex > 1) {
            var tempChild = iL["head"];
            oldHeadIdx = iL[tempChild]["vtxIdx"];
            iL[newVtx]["next"] = tempChild;
            iL[tempChild]["prev"] = newVtx;
            iL["head"] = newVtx;
        }
        else
            iL["head"] = newVtx;

        // Then, draw edge
        var newVtxIdx = iL[parseInt(val)]["vtxIdx"];
        if (amountVertex > 1) {
            // Vertex vtx = new Vertex(v)
            cs = createState(iL, vertexTraversed, edgeTraversed);
            cs["vl"][newVtxIdx]["state"] = VERTEX_HIGHLIGHTED;
            cs["vl"][newVtxIdx]["extratext"] = "vtx";
            cs["vl"][oldHeadIdx]["extratext"] = "head";
            cs["el"][newVtxIdx]["state"] = OBJ_HIDDEN;
            if ((activeStatus == "doublylist") || (activeStatus == "deque"))
                cs["el"][newVtxIdx + BACK_EDGE_CONST]["state"] = OBJ_HIDDEN;
            cs["status"] = 'Tạo đỉnh mới để lưu giá trị. {val}.'.replace("{val}", val);
            cs["lineNo"] = 1;
            stateList.push(cs);
            cs = createState(iL, vertexTraversed, edgeTraversed);
            var edgeHighlighted = iL[newVtx]["vtxIdx"];
            cs["el"][edgeHighlighted]["animateHighlighted"] = true;
            cs["el"][edgeHighlighted]["state"] = EDGE_HIGHLIGHTED;
            cs["vl"][newVtxIdx]["state"] = VERTEX_HIGHLIGHTED;
            cs["vl"][newVtxIdx]["extratext"] = "vtx";
            cs["vl"][oldHeadIdx]["extratext"] = "head";
            if ((activeStatus == "doublylist") || (activeStatus == "deque"))
                cs["el"][newVtxIdx + BACK_EDGE_CONST]["state"] = OBJ_HIDDEN;
            cs["status"] = 'Bây giờ, vtx.next trỏ đến the current head.';
            cs["lineNo"] = 2;
            stateList.push(cs);

            if ((activeStatus == "doublylist") || (activeStatus == "deque")) {
                // if (head != null) head.prev = vtx
                cs = createState(iL, vertexTraversed, edgeTraversed);
                cs["vl"][oldHeadIdx]["extratext"] = "head";
                cs["vl"][newVtxIdx]["state"] = VERTEX_HIGHLIGHTED;
                cs["vl"][newVtxIdx]["extratext"] = "vtx";
                cs["el"][newVtxIdx + BACK_EDGE_CONST]["state"] = EDGE_HIGHLIGHTED;
                cs["el"][newVtxIdx + BACK_EDGE_CONST]["animateHighlighted"] = true;
                // (Old) head.prev trỏ đến vtx.
                cs["status"] = '(Old) head.prev trỏ đến vtx.';
                cs["lineNo"] = 3;
                stateList.push(cs);
            }
        }
        else {
            cs = createState(iL, vertexTraversed, edgeTraversed);
            cs["vl"][newVtxIdx]["state"] = VERTEX_HIGHLIGHTED;
            cs["vl"][newVtxIdx]["extratext"] = "vtx";
            cs["status"] = 'Tạo đỉnh mới để lưu giá trị. {val}.'.replace("{val}", val) + '<br>Tuy nhiên, vì head hiện là rỗng, temp.next vẫn là null.';
            cs["lineNo"] = [1, 2];
            stateList.push(cs);
        }

        cs = createState(iL, vertexTraversed, edgeTraversed);
        cs["vl"][newVtxIdx]["state"] = VERTEX_GREEN_FILL;
        cs["vl"][newVtxIdx]["extratext"] = "head/vtx";
        cs["status"] = 'Bây giờ, head trỏ đến vtx.';
        if ((activeStatus == "doublylist") || (activeStatus == "deque"))
            cs["lineNo"] = 4;
        else
            cs["lineNo"] = 3;
        stateList.push(cs);

        if (amountVertex == 1) {
            cs = createState(iL, vertexTraversed, edgeTraversed);
            cs["vl"][newVtxIdx]["state"] = VERTEX_GREEN_FILL;
            cs["vl"][newVtxIdx]["extratext"] = "head/tail/vtx";
            cs["status"] = 'Tail trỏ đến head.';
            cs["lineNo"] = 3;
            stateList.push(cs);
        }

        recalculatePosition();
        cs = createState(iL, vertexTraversed, edgeTraversed);
        cs["vl"][newVtxIdx]["state"] = VERTEX_GREEN_FILL;
        cs["vl"][newVtxIdx]["extratext"] = "head" + (amountVertex == 1 ? "/tail" : "") + "/vtx";
        cs["status"] = 'Bố cục lại Danh sách liên kết để dễ hình dung.<br>Độ phức tạp là O({N}).'.replace("{N}", "1");
        cs["lineNo"] = 0;
        stateList.push(cs);
        graphWidget.startAnimation(stateList, callback);
        populatePseudocode(1);
        return true;
    }

    this.insertTail = function (v, callback) {
        if (amountVertex == 0) return this.insertHead(v, callback);

        var val = parseInt(v);
        var tempinternalList = deepCopy(iL); // Use this to simulate internal insertion

        // 1. Check whether value is number
        if (isNaN(val)) {
            // Vui lòng chỉ nhập số nguyên
            $('#insert-err').html('Vui lòng chỉ nhập số nguyên');
            if (typeof callback == 'function') callback();
            return false;
        }
        // 2. No duplicates allowed. Also works if more than one similar value are inserted
        if (tempinternalList[val] != null) {
            $('#insert-err').html('Không cho phép đỉnh trùng lặp!');
            if (typeof callback == 'function') callback();
            return false;
        }
        // 3. Check range
        if (parseInt(val) < valueRange[0] || parseInt(val) > valueRange[1]) {
            $('#insert-err').html('Xin lỗi, chỉ những giá trị giữa {range0} và {range1} mới có thể chèn.'.replace("{range0}", valueRange[0]).replace("{range1}", valueRange[1]));
            if (typeof callback == 'function') callback();
            return false;
        }
        // 4. check size
        if (amountVertex >= maxSize) {
            $('#insert-err').html('Xin lỗi, kích thước tối đa là {maxSize}.'.replace("{maxSize}", maxSize));
            if (typeof callback == 'function') callback();
            return false;
        }

        var stateList = [], vertexTraversed = {}, edgeTraversed = {}, currentVertex = iL["head"], cs = {},
            curVtxIdx;

        // Find prev
        while (currentVertex != val && currentVertex != null) {
            var nextVertex;
            nextVertex = iL[currentVertex]["next"];
            if (nextVertex == null) break;
            else currentVertex = nextVertex;
        }

        // Begin insertion, first, update internal representation
        var newVtx = parseInt(val);
        var oldTailIdx = iL[currentVertex]["vtxIdx"];

        iL[parseInt(val)] = {
            "next": null,
            "vtxIdx": vertexClassNumberCounter++
        };

        if (currentVertex != null) {
            iL[parseInt(val)]["prev"] = currentVertex;
            iL[currentVertex]["next"] = parseInt(val);
        }
        else {
            iL[parseInt(val)]["prev"] = null;
            iL["head"] = parseInt(val);
        }

        amountVertex++;
        recalculatePosition();

        var newVtxIdx = iL[parseInt(val)]["vtxIdx"];
        curVtxIdx = iL[currentVertex]["vtxIdx"];

        cs = createState(iL, vertexTraversed, edgeTraversed);
        cs["vl"][newVtxIdx]["state"] = VERTEX_HIGHLIGHTED;
        cs["vl"][newVtxIdx]["extratext"] = "vtx";
        cs["vl"][oldTailIdx]["extratext"] = "tail";
        cs["el"][curVtxIdx]["state"] = OBJ_HIDDEN;
        if ((activeStatus == "doublylist") || (activeStatus == "deque"))
            cs["el"][curVtxIdx + BACK_EDGE_CONST]["state"] = OBJ_HIDDEN;
        cs["status"] = 'Tạo đỉnh mới để lưu giá trị. {val}.'.replace("{val}", val);
        cs["lineNo"] = 1;
        stateList.push(cs);

        cs = createState(iL, vertexTraversed, edgeTraversed);
        cs["vl"][curVtxIdx]["state"] = VERTEX_GREEN_FILL;
        cs["vl"][newVtxIdx]["state"] = VERTEX_HIGHLIGHTED;
        cs["vl"][newVtxIdx]["extratext"] = "vtx";
        cs["vl"][oldTailIdx]["extratext"] = "tail";
        cs["el"][curVtxIdx]["state"] = EDGE_TRAVERSED;
        cs["el"][curVtxIdx]["animateHighlighted"] = true;
        if ((activeStatus == "doublylist") || (activeStatus == "deque"))
            cs["el"][curVtxIdx + BACK_EDGE_CONST]["state"] = OBJ_HIDDEN;
        cs["status"] = 'Bây giờ, temp.next trỏ đến new vertex.';
        cs["lineNo"] = 2;
        stateList.push(cs);

        if ((activeStatus == "doublylist") || (activeStatus == "deque")) {
            cs = createState(iL, vertexTraversed, edgeTraversed);
            cs["vl"][curVtxIdx]["state"] = VERTEX_GREEN_FILL;
            cs["vl"][curVtxIdx]["extratext"] = "tail";
            cs["vl"][newVtxIdx]["state"] = VERTEX_HIGHLIGHTED;
            cs["vl"][newVtxIdx]["extratext"] = "vtx";
            cs["el"][curVtxIdx + BACK_EDGE_CONST]["state"] = EDGE_HIGHLIGHTED;
            cs["el"][curVtxIdx + BACK_EDGE_CONST]["animateHighlighted"] = true;
            cs["status"] = 'Cập nhật con trỏ prev của đỉnh mới để trỏ ngược về tail (cũ).';
            cs["lineNo"] = 2;
            stateList.push(cs);
        }

        cs = createState(iL, vertexTraversed, edgeTraversed);
        cs["vl"][newVtxIdx]["state"] = VERTEX_GREEN_FILL;
        cs["vl"][newVtxIdx]["extratext"] = "tail/vtx";
        cs["status"] = 'Bây giờ, con trỏ tail trỏ đến đỉnh mới.<br>Độ phức tạp là O(1) nếu chúng ta giữ nguyên con trỏ đuôi.';
        cs["lineNo"] = 3;
        stateList.push(cs);

        graphWidget.startAnimation(stateList, callback);
        populatePseudocode(2);
        return true;
    }

    this.insertKth = function (index, v, callback) {
        // index checking start
        if (isNaN(index)) {
            $('#insert-err').html('Vui lòng chỉ nhập số nguyên');
            return false;
        }
        if ((index < 1) || (index > amountVertex)) {
            $('#insert-err').html('Vui lòng nhập một chỉ mục hợp lệ giữa [1..{limit}].'.replace("{limit}", Math.max(1, amountVertex - 1)));
            return false;
        }

        // check if it is insertion at index 0/N i.e. insert head/tail, respectively (will no longer be used?)
        if (index == 0) return this.insertHead(v);
        if (index == amountVertex) return this.insertTail(v);

        var val = parseInt(v);
        var tempinternalList = deepCopy(iL); // Use this to simulate internal insertion

        // 1. Check whether value is number
        if (isNaN(val)) {
            $('#insert-err').html('Vui lòng chỉ nhập số nguyên');
            return false;
        }
        // 2. No duplicates allowed. Also works if more than one similar value are inserted
        if (tempinternalList[val] != null) {
            $('#insert-err').html('Không cho phép đỉnh trùng lặp!');
            return false;
        }
        // 3. Check range
        if (parseInt(val) < valueRange[0] || parseInt(val) > valueRange[1]) {
            $('#insert-err').html('Xin lỗi, chỉ những giá trị giữa {range0} and {range1} mới có thể chèn.'.replace("{range0}", valueRange[0]).replace("{range1}", valueRange[1]));
            return false;
        }
        // 4. check size
        if (amountVertex >= maxSize) {
            $('#insert-err').html('Xin lỗi, kích thước tối đa là {maxSize}.'.replace("{maxSize}", maxSize));
            return false;
        }

        var stateList = [], vertexTraversed = {}, edgeTraversed = {}, currentVertex = iL["head"], cs = {};
        var temp1Idx, temp2Idx, newVtxIdx;

        cs = createState(iL, vertexTraversed, edgeTraversed);
        temp1Idx = iL[currentVertex]["vtxIdx"];
        cs["vl"][temp1Idx]["state"] = VERTEX_HIGHLIGHTED;
        cs["vl"][temp1Idx]["extratext"] = "0/head/pre";
        vertexTraversed[currentVertex] = true;
        // Set prev to head.
        cs["status"] = 'Set temp1 to head.';
        cs["lineNo"] = 1;
        stateList.push(cs);

        // Find prev
        var i = 0;
        for (var k = 0; k < index - 1; k++) {
            cs = createState(iL, vertexTraversed, edgeTraversed);
            temp1Idx = iL[currentVertex]["vtxIdx"];
            cs["vl"][temp1Idx]["state"] = VERTEX_HIGHLIGHTED;
            cs["vl"][temp1Idx]["extratext"] = i + (i == 0 ? "/head" : (iL[currentVertex]["next"] == null ? "/tail" : "")) + "/pre";
            vertexTraversed[currentVertex] = true;
            cs["status"] = 'Giảm k, chỉ số được chỉ định chưa đạt.<br>k bây giờ là: {k}.'.replace("{k}", k);
            cs["lineNo"] = 2;
            stateList.push(cs);

            var nextVertex;
            nextVertex = iL[currentVertex]["next"];

            if (nextVertex == null) break;
            else currentVertex = nextVertex;

            curVtx = iL[currentVertex]["prev"];
            cs = createState(iL, vertexTraversed, edgeTraversed);
            var edgeHighlighted = iL[curVtx]["vtxIdx"];
            edgeTraversed[edgeHighlighted] = true;
            cs["vl"][temp1Idx]["extratext"] = i + (i == 0 ? "/head" : (iL[currentVertex]["next"] == null ? "/tail" : "")) + "/pre";
            cs["el"][edgeHighlighted]["animateHighlighted"] = true;
            cs["el"][edgeHighlighted]["state"] = EDGE_TRAVERSED;
            cs["status"] = 'Chúng ta thiết lập trước cho đỉnh tiếp theo.';
            cs["lineNo"] = 3;
            stateList.push(cs);

            i++;
        }

        if (currentVertex != null) {
            cs = createState(iL, vertexTraversed, edgeTraversed);
            temp1Idx = iL[currentVertex]["vtxIdx"];
            cs["vl"][temp1Idx]["state"] = VERTEX_HIGHLIGHTED;
            cs["vl"][temp1Idx]["extratext"] = i + (i == 0 ? "/head" : (iL[currentVertex]["next"] == null ? "/tail" : "")) + "/pre";
            vertexTraversed[currentVertex] = true;
            cs["status"] = 'Chúng ta đã tìm ra điểm chèn. <br> Chúng ta tiếp tục bước chèn tiếp theo.';
            cs["lineNo"] = 2;
            stateList.push(cs);
        }

        // Begin insertion, first, update internal representation
        var temp2Vertex = iL[currentVertex]["next"];
        temp2Idx = iL[temp2Vertex]["vtxIdx"];
        cs = createState(iL, vertexTraversed, edgeTraversed);
        cs["vl"][temp1Idx]["state"] = VERTEX_HIGHLIGHTED;
        cs["vl"][temp1Idx]["extratext"] = i + (i == 0 ? "/head" : (iL[currentVertex]["next"] == null ? "/tail" : "")) + "/pre";
        cs["vl"][temp2Idx]["state"] = VERTEX_BLUE_FILL;
        cs["vl"][temp2Idx]["extratext"] = (i + 1) + (i + 1 == 0 ? "/head" : (iL[temp2Vertex]["next"] == null ? "/tail" : "")) + "/aft";
        cs["el"][temp1Idx]["state"] = EDGE_TRAVERSED;
        cs["el"][temp1Idx]["animateHighlighted"] = true;
        edgeTraversed[temp1Idx] = true;
        cs["status"] = 'Chỉ mục trước khi tìm thấy điểm chèn. <br> Prev là trước điểm chèn và phía sau là điểm chèn.';
        cs["lineNo"] = 4;
        stateList.push(cs);

        iL[parseInt(val)] = {
            "next": null,
            "vtxIdx": vertexClassNumberCounter++
        };
        amountVertex++;
        //modified this part for linked list insertion
        var newVtx = parseInt(val);
        newVtxIdx = iL[parseInt(val)]["vtxIdx"];
        var tempChild;

        iL[newVtx]["cx"] = iL[temp2Vertex]["cx"];
        iL[newVtx]["cy"] = iL[temp2Vertex]["cy"] + 70;

        cs = createState(iL, vertexTraversed, edgeTraversed);
        cs["vl"][temp1Idx]["state"] = VERTEX_HIGHLIGHTED;
        cs["vl"][temp1Idx]["extratext"] = i + (i == 0 ? "/head" : (iL[currentVertex]["next"] == null ? "/tail" : "")) + "/pre";
        cs["vl"][temp2Idx]["state"] = VERTEX_BLUE_FILL;
        cs["vl"][temp2Idx]["extratext"] = (i + 1) + (i + 1 == 0 ? "/head" : (iL[temp2Vertex]["next"] == null ? "/tail" : "")) + "/aft";
        cs["vl"][newVtxIdx]["state"] = VERTEX_GREEN_FILL;
        cs["vl"][newVtxIdx]["extratext"] = "vtx";
        cs["status"] = 'Tạo đỉnh mới để lưu giá trị. {val}.'.replace("{val}", val);
        cs["lineNo"] = 5;
        stateList.push(cs);
        edgeTraversed[newVtxIdx] = true;

        // RELINK THE POINTERs
        iL[newVtx]["next"] = temp2Vertex;
        iL[temp2Vertex]["prev"] = newVtx;

        cs = createState(iL, vertexTraversed, edgeTraversed);
        cs["vl"][temp1Idx]["state"] = VERTEX_HIGHLIGHTED;
        cs["vl"][temp1Idx]["extratext"] = i + (i == 0 ? "/head" : (iL[currentVertex]["next"] == null ? "/tail" : "")) + "/pre";
        cs["vl"][temp2Idx]["state"] = VERTEX_BLUE_FILL;
        cs["vl"][temp2Idx]["extratext"] = (i + 1) + (i + 1 == 0 ? "/head" : (iL[temp2Vertex]["next"] == null ? "/tail" : "")) + "/aft";
        cs["vl"][newVtxIdx]["state"] = VERTEX_GREEN_FILL;
        cs["vl"][newVtxIdx]["extratext"] = "vtx";
        cs["el"][temp1Idx]["state"] = EDGE_TRAVERSED;
        cs["el"][newVtxIdx]["state"] = EDGE_GREEN;
        cs["el"][newVtxIdx]["animateHighlighted"] = true;
        if ((activeStatus == "doublylist") || (activeStatus == "deque"))
            cs["el"][newVtxIdx + BACK_EDGE_CONST]["state"] = OBJ_HIDDEN;
        cs["status"] = 'vtx.next trỏ đến aft.';
        cs["lineNo"] = 6;
        stateList.push(cs);

        if ((activeStatus == "doublylist") || (activeStatus == "deque")) {
            cs = createState(iL, vertexTraversed, edgeTraversed);
            cs["vl"][temp1Idx]["state"] = VERTEX_HIGHLIGHTED;
            cs["vl"][temp1Idx]["extratext"] = i + (i == 0 ? "/head" : (iL[currentVertex]["next"] == null ? "/tail" : "")) + "/pre";
            cs["vl"][temp2Idx]["state"] = VERTEX_BLUE_FILL;
            cs["vl"][temp2Idx]["extratext"] = (i + 1) + (i + 1 == 0 ? "/head" : (iL[temp2Vertex]["next"] == null ? "/tail" : "")) + "/aft";
            cs["vl"][newVtxIdx]["state"] = VERTEX_GREEN_FILL;
            cs["vl"][newVtxIdx]["extratext"] = "vtx";
            cs["el"][temp1Idx]["state"] = EDGE_TRAVERSED;
            cs["el"][newVtxIdx]["state"] = EDGE_GREEN;
            cs["el"][newVtxIdx + BACK_EDGE_CONST]["state"] = EDGE_GREEN;
            cs["el"][temp1Idx + BACK_EDGE_CONST]["state"] = OBJ_HIDDEN;
            cs["status"] = 'aft.prev trỏ đến vtx.';
            cs["lineNo"] = 6;
            stateList.push(cs);
        }

        iL[currentVertex]["next"] = newVtx;
        iL[newVtx]["prev"] = currentVertex;

        cs = createState(iL, vertexTraversed, edgeTraversed);
        cs["vl"][temp1Idx]["state"] = VERTEX_HIGHLIGHTED;
        cs["vl"][temp1Idx]["extratext"] = i + (i == 0 ? "/head" : (iL[currentVertex]["next"] == null ? "/tail" : "")) + "/pre";
        cs["vl"][temp2Idx]["state"] = VERTEX_BLUE_FILL;
        cs["vl"][temp2Idx]["extratext"] = (i + 2) + (i + 1 == 0 ? "/head" : (iL[temp2Vertex]["next"] == null ? "/tail" : "")) + "/aft";
        cs["vl"][newVtxIdx]["state"] = VERTEX_GREEN_FILL;
        cs["vl"][newVtxIdx]["extratext"] = (i + 1) + "/vtx";
        cs["el"][newVtxIdx]["state"] = EDGE_GREEN;
        cs["el"][temp1Idx]["state"] = EDGE_TRAVERSED;
        if ((activeStatus == "doublylist") || (activeStatus == "deque"))
            cs["el"][temp1Idx + BACK_EDGE_CONST]["state"] = OBJ_HIDDEN;
        cs["status"] = 'pre.next trỏ đến vtx.';
        cs["lineNo"] = 7;
        stateList.push(cs);

        if ((activeStatus == "doublylist") || (activeStatus == "deque")) {
            cs = createState(iL, vertexTraversed, edgeTraversed);
            cs["vl"][temp1Idx]["state"] = VERTEX_HIGHLIGHTED;
            cs["vl"][temp1Idx]["extratext"] = i + (i == 0 ? "/head" : (iL[currentVertex]["next"] == null ? "/tail" : "")) + "/pre";
            cs["vl"][temp2Idx]["state"] = VERTEX_BLUE_FILL;
            cs["vl"][temp2Idx]["extratext"] = (i + 2) + (i + 1 == 0 ? "/head" : (iL[temp2Vertex]["next"] == null ? "/tail" : "")) + "/aft";
            cs["vl"][newVtxIdx]["state"] = VERTEX_GREEN_FILL;
            cs["vl"][newVtxIdx]["extratext"] = temp2Idx + "/vtx";
            cs["el"][temp1Idx]["state"] = EDGE_TRAVERSED;
            cs["el"][temp1Idx + BACK_EDGE_CONST]["state"] = EDGE_TRAVERSED;
            cs["status"] = 'vtx.prev trỏ đến pre.';
            cs["lineNo"] = 7;
            stateList.push(cs);
        }

        recalculatePosition();
        cs = createState(iL, {}, {});
        cs["vl"][newVtxIdx]["state"] = VERTEX_GREEN_FILL;
        cs["vl"][newVtxIdx]["extratext"] = (i + 1) + "/vtx";
        cs["status"] = 'Bố cục lại Danh sách liên kết để dễ hình dung.<br>Độ phức tạp là O({N}).'.replace("{N}", "N");
        cs["lineNo"] = 0;
        stateList.push(cs);

        graphWidget.startAnimation(stateList, callback);
        populatePseudocode(0);
        return true;
    }

    /* FOURTH MENU: Remove */
    this.removeHead = function (callback) {
        var stateList = [], vertexTraversed = {}, edgeTraversed = {}, currentVertex = iL["head"], cs = {},
            curVtxIdx;
        if (currentVertex == null) {
            cs = createState(iL, vertexTraversed, edgeTraversed);
            cs["status"] = 'Danh sách liên kết đã trống.<br>Không có tác vụ nào được thực hiện.';
            cs["lineNo"] = 1;
            stateList.push(cs);
        }
        else {
            if (iL[currentVertex]["next"] == null) { // head has no next vertex
                // temp = head
                cs = createState(iL, vertexTraversed, edgeTraversed);
                curVtxIdx = iL[currentVertex]["vtxIdx"];
                cs["vl"][curVtxIdx]["state"] = VERTEX_HIGHLIGHTED;
                cs["status"] = 'Phần head là đỉnh duy nhất trong Danh sách này.';
                cs["lineNo"] = 2;
                stateList.push(cs);

                // head = head.next
                cs = createState(iL, vertexTraversed, edgeTraversed);
                curVtxIdx = iL[currentVertex]["vtxIdx"];
                cs["vl"][curVtxIdx]["state"] = VERTEX_HIGHLIGHTED;
                cs["status"] = 'Head trỏ đến next (which is null).';
                cs["lineNo"] = 3;
                stateList.push(cs);

                curVtxIdx = iL[currentVertex]["vtxIdx"];

                // delete temp
                iL["head"] = null;
                delete iL[currentVertex];
                delete vertexTraversed[currentVertex];
                delete edgeTraversed[curVtxIdx];

                cs = createState(iL, vertexTraversed, edgeTraversed);
                cs["status"] = 'Loại bỏ đỉnh đầu(head). <br> Bây giờ chúng ta có một Danh sách trống.';
                cs["lineNo"] = 4;
                stateList.push(cs);
            }
            else { // head has next vertex

                curVtxIdx = iL[currentVertex]["vtxIdx"];
                cs = createState(iL, vertexTraversed, edgeTraversed);
                cs["vl"][curVtxIdx]["state"] = VERTEX_HIGHLIGHTED;
                cs["vl"][curVtxIdx]["extratext"] = "head/temp";

                cs["status"] = 'Head có tồn tại đỉnh kế tiếp.';
                cs["lineNo"] = 2;
                stateList.push(cs);

                var rightChildVertex = iL[currentVertex]["next"];
                curVtxIdx = iL[currentVertex]["vtxIdx"];
                nextVtxIdx = iL[rightChildVertex]["vtxIdx"];

                cs = createState(iL, vertexTraversed, edgeTraversed);
                cs["vl"][curVtxIdx]["state"] = VERTEX_HIGHLIGHTED;
                cs["vl"][curVtxIdx]["extratext"] = "temp";
                cs["vl"][nextVtxIdx]["state"] = VERTEX_GREEN_FILL;
                cs["vl"][nextVtxIdx]["extratext"] = "head";
                cs["el"][curVtxIdx]["state"] = EDGE_GREEN;
                cs["el"][curVtxIdx]["animateHighlighted"] = true;

                cs["status"] = 'head trỏ đến đỉnh kế tiếp.';
                cs["lineNo"] = 3;
                stateList.push(cs);

                iL["head"] = rightChildVertex;
                iL[rightChildVertex]["prev"] = null;

                // delete temp
                delete iL[currentVertex];
                delete vertexTraversed[currentVertex];
                delete edgeTraversed[curVtxIdx];
                cs = createState(iL, vertexTraversed, edgeTraversed);
                cs["vl"][nextVtxIdx]["state"] = VERTEX_GREEN_FILL;

                cs["status"] = 'Xóa (Prev) head.';
                cs["lineNo"] = 4;
                stateList.push(cs);

                if ((activeStatus == "doublylist") || (activeStatus == "deque")) {
                    // head.prev = null
                    cs = createState(iL, vertexTraversed, edgeTraversed);
                    cs["vl"][nextVtxIdx]["state"] = VERTEX_GREEN_FILL;
                    // Đặt head.prev thành null cho mục đích nhất quán.
                    cs["status"] = 'Đặt head.Prev thành null.';
                    cs["lineNo"] = 5;
                    stateList.push(cs);
                }

                // relayout
                amountVertex--;
                recalculatePosition();
                cs = createState(iL, vertexTraversed, edgeTraversed);
                cs["vl"][nextVtxIdx]["state"] = VERTEX_GREEN_FILL;
                if (amountVertex == 1) cs["vl"][nextVtxIdx]["extratext"] = "head/tail";
                cs["status"] = 'Bố trí lại Danh sách liên kết.<br>Độ phức tạp là O({N}).'.replace("{N}", "1");
                stateList.push(cs);
            }
        }

        graphWidget.startAnimation(stateList, callback);
        populatePseudocode(5);
        return true;
    }

    this.removeTail = function (callback) {
        if (amountVertex == 1) return this.removeHead(callback); // special case

        var stateList = [], vertexTraversed = {}, edgeTraversed = {}, currentVertex = iL["head"], cs = {},
            curVtxIdx;

        if (currentVertex == null) {
            cs = createState(iL, vertexTraversed, edgeTraversed);
            cs["status"] = 'Danh sách liên kết đã trống.<br>Không có tác vụ nào được thực hiện.';
            cs["lineNo"] = 1;
            stateList.push(cs);
        }
        else {
            var nextVertex = iL[currentVertex]["next"], nextVtxIdx;

            // Vertex pre = head
            cs = createState(iL, vertexTraversed, edgeTraversed);
            curVtxIdx = iL[currentVertex]["vtxIdx"];
            cs["vl"][curVtxIdx]["state"] = VERTEX_HIGHLIGHTED;
            cs["vl"][curVtxIdx]["extratext"] = "head/pre";
            cs["status"] = 'Thiết lập con trỏ Prev. <br>Con trỏ Prev cuối cùng sẽ trỏ tới đỉnh cuối cùng trước con trỏ Tail.';
            cs["lineNo"] = 2;
            stateList.push(cs);

            // temp = head.next
            cs = createState(iL, vertexTraversed, edgeTraversed);
            curVtxIdx = iL[currentVertex]["vtxIdx"];
            cs["vl"][curVtxIdx]["state"] = VERTEX_HIGHLIGHTED;
            cs["vl"][curVtxIdx]["extratext"] = "head/pre";
            nextVtxIdx = iL[nextVertex]["vtxIdx"];
            cs["vl"][nextVtxIdx]["state"] = VERTEX_GREEN_FILL;
            cs["vl"][nextVtxIdx]["extratext"] = (iL[nextVertex]["next"] == null ? "tail/" : "") + "temp";
            cs["el"][curVtxIdx]["animateHighlighted"] = true;
            cs["el"][curVtxIdx]["state"] = EDGE_TRAVERSED;
            cs["status"] = 'Thiết lập con trỏ tạm thời(temp). <br>Con trỏ temp cuối cùng sẽ trỏ đến con trỏ Tail hiện tại.';
            cs["lineNo"] = 3;
            stateList.push(cs);

            // Find vertex
            var i = 0;
            while (true) {
                cs = createState(iL, vertexTraversed, edgeTraversed);
                curVtxIdx = iL[currentVertex]["vtxIdx"];
                cs["vl"][curVtxIdx]["state"] = VERTEX_HIGHLIGHTED;
                cs["vl"][curVtxIdx]["extratext"] = (i == 0 ? "head/" : "") + "pre";
                nextVtxIdx = iL[nextVertex]["vtxIdx"];
                cs["vl"][nextVtxIdx]["state"] = VERTEX_GREEN_FILL;
                cs["vl"][nextVtxIdx]["extratext"] = (iL[nextVertex]["next"] == null ? "tail/" : "") + "temp";
                vertexTraversed[currentVertex] = true;
                cs["status"] = 'Kiểm tra xem temp.next có phải là null hay không.';
                cs["lineNo"] = 4;
                stateList.push(cs);

                if (iL[nextVertex]["next"] != null) {
                    nextVertex = iL[nextVertex]["next"];
                    currentVertex = iL[currentVertex]["next"];
                    i++;
                }
                else
                    break;

                cs = createState(iL, vertexTraversed, edgeTraversed);
                curVtxIdx = iL[currentVertex]["vtxIdx"];
                cs["vl"][curVtxIdx]["state"] = VERTEX_HIGHLIGHTED;
                cs["vl"][curVtxIdx]["extratext"] = (i == 0 ? "head/" : "") + "pre";
                nextVtxIdx = iL[nextVertex]["vtxIdx"];
                cs["vl"][nextVtxIdx]["state"] = VERTEX_GREEN_FILL;
                cs["vl"][nextVtxIdx]["extratext"] = (iL[nextVertex]["next"] == null ? "tail/" : "") + "temp";
                vertexTraversed[currentVertex] = true;
                curVtx = iL[currentVertex]["prev"];
                var edgeHighlighted = iL[curVtx]["vtxIdx"];
                cs["el"][edgeHighlighted]["animateHighlighted"] = true;
                cs["el"][edgeHighlighted]["state"] = EDGE_TRAVERSED;
                edgeTraversed[edgeHighlighted] = true;
                var edgeHighlighted2 = iL[currentVertex]["vtxIdx"];
                cs["el"][edgeHighlighted2]["animateHighlighted"] = true;
                cs["el"][edgeHighlighted2]["state"] = EDGE_GREEN;
                cs["status"] = 'Không phải là giá trị null. <br> Vì vậy, cả con trỏ Prev và con trỏ Temp đều tiến tới đỉnh tiếp theo.';
                cs["lineNo"] = 5;
                stateList.push(cs);
            }

            cs = createState(iL, vertexTraversed, edgeTraversed);
            curVtxIdx = iL[currentVertex]["vtxIdx"];
            nextVtxIdx = iL[nextVertex]["vtxIdx"];
            cs["el"][curVtxIdx]["state"] = OBJ_HIDDEN;
            cs["vl"][curVtxIdx]["state"] = VERTEX_HIGHLIGHTED;
            cs["vl"][curVtxIdx]["extratext"] = (i == 0 ? "head/" : "") + "pre";
            nextVtxIdx = iL[nextVertex]["vtxIdx"];
            cs["vl"][nextVtxIdx]["state"] = VERTEX_GREEN_FILL;
            cs["vl"][nextVtxIdx]["extratext"] = "tail/temp";
            vertexTraversed[currentVertex] = true;
            cs["status"] = 'Nó là null. <br> Vì vậy, ta đặt con trỏ Prev (của node kế trước đó) thành null.';
            cs["lineNo"] = 6;
            stateList.push(cs);

            var curVtx = iL[nextVertex]["prev"];
            if (curVtx != null) iL[curVtx]["next"] = null;
            else iL["head"] = null;

            // delete temp, tail = pre
            delete iL[nextVertex];
            delete vertexTraversed[nextVertex];
            delete edgeTraversed[nextVtxIdx];

            amountVertex--;

            cs = createState(iL, vertexTraversed, edgeTraversed);
            cs["vl"][curVtxIdx]["state"] = VERTEX_GREEN_FILL;
            if (amountVertex == 1) cs["vl"][curVtxIdx]["extratext"] = "head/tail"; r.
                cs["status"] = 'Xóa temp (the previus tail) sau đó cập nhật con trỏ Tail thành Prev. Độ phức tạp là O (N).';
            cs["lineNo"] = 7;
            stateList.push(cs);
        }

        graphWidget.startAnimation(stateList, callback);
        populatePseudocode(6);
        return true;
    }

    this.removeTailDLL = function (callback) {
        if (amountVertex == 1) return this.removeHead(callback);

        var stateList = [], vertexTraversed = {}, edgeTraversed = {}, currentVertex = iL["head"], cs = {};

        if (currentVertex == null) {
            cs = createState(iL, vertexTraversed, edgeTraversed);
            cs["status"] = 'Danh sách liên kết đã trống.<br>Không có tác vụ nào được thực hiện.';
            cs["lineNo"] = 1;
            stateList.push(cs);
        }
        else {
            var nextVertex = iL[currentVertex]["next"];
            var curVtxIdx, nextVtxIdx;

            // Find tail vertex
            while (true) {
                if (iL[nextVertex]["next"] != null) {
                    nextVertex = iL[nextVertex]["next"];
                    currentVertex = iL[currentVertex]["next"];
                }
                else
                    break;
            }

            curVtxIdx = iL[currentVertex]["vtxIdx"];
            nextVtxIdx = iL[nextVertex]["vtxIdx"];

            // temp = tail
            cs = createState(iL, vertexTraversed, edgeTraversed);
            cs["vl"][nextVtxIdx]["state"] = VERTEX_HIGHLIGHTED;
            cs["vl"][nextVtxIdx]["extratext"] = "tail/temp";
            // Set temp to (old) tail.
            cs["status"] = 'Gán temp = p.Tail(cũ).';
            cs["lineNo"] = 2;
            stateList.push(cs);

            // tail = tail.prev
            cs = createState(iL, vertexTraversed, edgeTraversed);
            cs["vl"][nextVtxIdx]["state"] = VERTEX_HIGHLIGHTED;
            cs["vl"][nextVtxIdx]["extratext"] = "temp";
            cs["el"][curVtxIdx + BACK_EDGE_CONST]["state"] = EDGE_HIGHLIGHTED;
            cs["vl"][curVtxIdx]["state"] = VERTEX_GREEN_FILL;
            cs["vl"][curVtxIdx]["extratext"] = "tail";
            // Set tail to tail.prev
            cs["status"] = 'Gán p.Tail = p.Prev';
            cs["lineNo"] = 3;
            stateList.push(cs);

            // tail.next = null
            cs = createState(iL, vertexTraversed, edgeTraversed);
            cs["vl"][curVtxIdx]["state"] = VERTEX_GREEN_FILL;
            cs["vl"][curVtxIdx]["extratext"] = "tail";
            cs["vl"][nextVtxIdx]["state"] = VERTEX_HIGHLIGHTED;
            cs["vl"][nextVtxIdx]["extratext"] = "temp";
            cs["el"][curVtxIdx]["state"] = OBJ_HIDDEN;
            vertexTraversed[currentVertex] = true;
            // Set the next of (new) tail to null.
            cs["status"] = 'Gán p.Tail(mới) là null.';
            cs["lineNo"] = 4;
            stateList.push(cs);

            var curVtx = iL[nextVertex]["prev"];
            if (curVtx != null) iL[curVtx]["next"] = null;
            else iL["head"] = null;

            delete iL[nextVertex];
            delete vertexTraversed[nextVertex];
            delete edgeTraversed[nextVtxIdx];

            amountVertex--;

            cs = createState(iL, vertexTraversed, edgeTraversed);
            cs["vl"][curVtxIdx]["state"] = VERTEX_GREEN_FILL;
            if (amountVertex == 1) cs["vl"][curVtxIdx]["extratext"] = "head/tail";
            // Delete temp.
            // The whole operations is just O(1) as we can access (old) tail.prev.
            cs["status"] = 'Xóa Temp. <br> Độ phức tạp thuật toán O(1).';
            cs["lineNo"] = 5;
            stateList.push(cs);
        }

        graphWidget.startAnimation(stateList, callback);
        populatePseudocode(8);
        return true;
    }

    this.removeKth = function (v, callback) {
        var index = parseInt(v);

        // Check whether value is number
        if (isNaN(index)) {
            $('#remove-err').html('Vui lòng chỉ nhập số nguyên');
            return false;
        }
        if (amountVertex < 3) {
            $('#remove-err').html('Thao tác này chỉ hoạt động đối với N lớn hơn 2.');
            return false;
        }
        if ((index < 1) || (index >= amountVertex - 1)) {
            $('#remove-err').html('Vui lòng nhập một chỉ mục hợp lệ giữa [1..{limit}].'.replace("{limit}", Math.max(1, amountVertex - 2)));
            return false;
        }

        if (index == 0) return this.removeHead(); // not going to be executable
        if (index == amountVertex - 1) {
            if (this.getActiveStatus() == "doublylist") return this.removeTailDLL();
            else return this.removeTail();
        }

        var stateList = [], vertexTraversed = {}, edgeTraversed = {}, prevVtx = iL["head"], delVtx, afterVtx,
            cs = {};
        var prevIdx, delIdx, afterIdx;

        if (prevVtx == null) {
            cs = createState(iL, vertexTraversed, edgeTraversed);
            cs["status"] = 'Danh sách liên kết đã trống.<br>Không có tác vụ nào được thực hiện.';
            cs["lineNo"] = 1;
            stateList.push(cs);
        }
        else {
            // Vertex pre = head
            prevIdx = iL[prevVtx]["vtxIdx"];
            cs = createState(iL, vertexTraversed, edgeTraversed);
            cs["vl"][prevIdx]["state"] = VERTEX_HIGHLIGHTED;
            cs["vl"][prevIdx]["extratext"] = "0/head/pre";
            cs["status"] = 'Gán con trỏ Prev là head. <br> Con trỏ Prev sẽ dừng tại một đỉnh trước đỉnh bị xóa.';
            cs["lineNo"] = 2;
            stateList.push(cs);

            // Find vertex
            for (i = 0; i < index - 1; i++) {
                cs = createState(iL, vertexTraversed, edgeTraversed);
                cs["vl"][prevIdx]["state"] = VERTEX_HIGHLIGHTED;
                cs["vl"][prevIdx]["extratext"] = i + (i == 0 ? "/head" : "") + "/pre";
                vertexTraversed[prevVtx] = true; k
            }
            cs["status"] = 'Vị trí cần xóa chưa được tìm thấy!.<br>k = {i}.'.replace("{k}", i);
            cs["lineNo"] = 3;
            stateList.push(cs);

            // important assignment
            var edgeHighlighted = iL[prevVtx]["vtxIdx"]; // before moving
            prevVtx = iL[prevVtx]["next"];
            prevIdx = iL[prevVtx]["vtxIdx"];

            // pre = pre.next
            cs = createState(iL, vertexTraversed, edgeTraversed);
            cs["vl"][prevIdx]["state"] = VERTEX_HIGHLIGHTED;
            cs["vl"][prevIdx]["extratext"] = (i + 1) + "/pre";
            edgeTraversed[edgeHighlighted] = true;
            cs["el"][edgeHighlighted]["animateHighlighted"] = true;
            cs["el"][edgeHighlighted]["state"] = EDGE_TRAVERSED;
            cs["status"] = 'Con trỏ Prev tiếp tục trỏ đến đỉnh tiếp theo.';
            cs["lineNo"] = 4;
            stateList.push(cs);
        }

        cs = createState(iL, vertexTraversed, edgeTraversed);
        cs["vl"][prevIdx]["state"] = VERTEX_HIGHLIGHTED;
        cs["vl"][prevIdx]["extratext"] = i + "/pre";
        vertexTraversed[prevVtx] = true;
        cs["status"] = 'k là 0, hiện tại con trỏ Prev đã trỏ đến đỉnh sau đỉnh cần xóa. <br> Chúng ta ngừng việc tìm kiếm vị trí và bắt đầu thực hiện xóa node.';
        cs["lineNo"] = 3;
        stateList.push(cs);

        var delVertex = iL[prevVtx]["next"];
        delIdx = iL[delVertex]["vtxIdx"];
        var afterVertex = iL[delVertex]["next"];
        afterIdx = iL[afterVertex]["vtxIdx"];

        cs = createState(iL, vertexTraversed, edgeTraversed);
        cs["vl"][prevIdx]["state"] = VERTEX_HIGHLIGHTED;
        cs["vl"][prevIdx]["extratext"] = i + "/pre";
        cs["vl"][delIdx]["state"] = VERTEX_RED_FILL;
        cs["vl"][delIdx]["extratext"] = (i + 1) + "/del";
        cs["vl"][afterIdx]["state"] = VERTEX_GREEN_FILL;
        cs["vl"][afterIdx]["extratext"] = (i + 2) + "/aft";
        edgeTraversed[prevIdx] = edgeTraversed[delIdx] = true;
        cs["el"][prevIdx]["animateHighlighted"] = cs["el"][delIdx]["animateHighlighted"] = true;
        cs["el"][prevIdx]["state"] = EDGE_HIGHLIGHTED;
        cs["el"][delIdx]["state"] = EDGE_RED;
        if ((activeStatus == "doublylist") || (activeStatus == "deque")) {
            cs["el"][prevIdx + BACK_EDGE_CONST]["state"] = EDGE_HIGHLIGHTED;
            cs["el"][delIdx + BACK_EDGE_CONST]["state"] = EDGE_RED;
        }
        vertexTraversed[prevVtx] = true;
        cs["status"] = 'Chúng ta lưu trữ tham chiếu   đỉnh sẽ bị xóa. <br> Chúng ta cũng lưu trữ tham chiếu đến đỉnh sau đỉnh sắp xóa.';
        cs["lineNo"] = 5;
        stateList.push(cs);

        iL[delVertex]["cy"] = 50 + iL[delVertex]["cy"];
        iL[prevVtx]["next"] = afterVertex;
        iL[afterVertex]["prev"] = prevVtx;

        cs = createState(iL, vertexTraversed, edgeTraversed);
        cs["vl"][prevIdx]["state"] = VERTEX_HIGHLIGHTED;
        cs["vl"][prevIdx]["extratext"] = i + "/pre";
        cs["vl"][delIdx]["state"] = VERTEX_RED_FILL;
        cs["vl"][delIdx]["extratext"] = "del";
        cs["vl"][afterIdx]["state"] = VERTEX_GREEN_FILL;
        cs["vl"][afterIdx]["extratext"] = (i + 1) + "/aft";
        cs["el"][prevIdx]["animateHighlighted"] = true;
        cs["el"][prevIdx]["state"] = EDGE_HIGHLIGHTED;
        if ((activeStatus == "doublylist") || (activeStatus == "deque")) {
            cs["el"][prevIdx + BACK_EDGE_CONST]["state"] = EDGE_HIGHLIGHTED;
            cs["el"][delIdx + BACK_EDGE_CONST]["state"] = OBJ_HIDDEN;
        }
        cs["status"] = 'Ta nối đỉnh, đỉnh phía sau đỉnh cần xóa (con trỏ trước) với đỉnh trước đỉnh cần xóa (con trỏ sau).';
        cs["lineNo"] = 6;
        stateList.push(cs);

        // delete temp
        delete iL[delVertex];
        delete vertexTraversed[delVertex];
        delete edgeTraversed[delIdx];
        cs = createState(iL, vertexTraversed, edgeTraversed);
        cs["vl"][prevIdx]["state"] = VERTEX_HIGHLIGHTED;
        cs["vl"][afterIdx]["state"] = VERTEX_GREEN_FILL;
        cs["status"] = 'Bây giờ chúng ta xóa đỉnh này.';
        cs["lineNo"] = 7;
        stateList.push(cs);
        amountVertex--;

        // relayout list
        recalculatePosition();
        cs = createState(iL, {}, {});
        cs["vl"][prevIdx]["state"] = VERTEX_HIGHLIGHTED;
        cs["vl"][afterIdx]["state"] = VERTEX_GREEN_FILL;
        if (amountVertex == 1) cs["vl"][afterIdx]["extratext"] = "head/tail";
        cs["status"] = 'Bố trí lại Danh sách liên kết.<br>Độ phức tạp là O({N}).'.replace("{N}", "N");
        stateList.push(cs);
    }

    graphWidget.startAnimation(stateList, callback);
    populatePseudocode(7);
    return true;
}

function init(initArr) {
    amountVertex = 0;
    clearScreen();

    for (var i = 0; i < initArr.length; i++) {
        var curVtx = iL["head"];
        var newVtx = parseInt(initArr[i]);

        if (curVtx == null) {
            iL["head"] = parseInt(newVtx);
            iL[newVtx] = {
                "prev": null,
                "next": null,
                "vtxIdx": amountVertex
            };
        }
        else {
            while (true) { // go to tail
                if (iL[curVtx]["next"] == null) break;
                curVtx = iL[curVtx]["next"];
            }
            iL[curVtx]["next"] = newVtx;
            iL[newVtx] = {
                "prev": curVtx,
                "next": null,
                "vtxIdx": amountVertex
            }
        }

        amountVertex++;
    }

    recalculatePosition();

    for (key in iL) {
        if (key == "head") continue;
        graphWidget.addVertex(iL[key]["cx"], iL[key]["cy"], key, iL[key]["vtxIdx"], true, (iL["head"] == key ? "head" : (iL[key]["next"] == null ? "tail" : ""))); // iL[key]["vtxIdx"] +
    }

    for (key in iL) {
        if (key == "head") continue;
        if (key == iL["head"]) continue;
        var curVtx = iL[key]["prev"];

        graphWidget.addEdge(iL[curVtx]["vtxIdx"], iL[key]["vtxIdx"], iL[curVtx]["vtxIdx"], EDGE_TYPE_DE, 1, true);
        if ((activeStatus == "doublylist") || (activeStatus == "deque"))
            graphWidget.addEdge(iL[key]["vtxIdx"], iL[curVtx]["vtxIdx"], iL[curVtx]["vtxIdx"] + BACK_EDGE_CONST, EDGE_TYPE_DE, 1, true);
    }
}

function clearScreen() {
    var key;

    for (key in iL) {
        if (key == "head") continue;
        graphWidget.removeEdge(iL[key]["vtxIdx"] + BACK_EDGE_CONST);
        graphWidget.removeEdge(iL[key]["vtxIdx"]);
    }

    for (key in iL) {
        if (key == "head") continue;
        graphWidget.removeVertex(iL[key]["vtxIdx"]);
    }

    iL = {};
    iL["head"] = null;
    amountVertex = 0;
}

this.getN = function () {
    return amountVertex;
}

/*
 * iLObject: a JS object with the same structure of iL. This means the List doen't have to be the List stored in this class
 * vertexTraversed: JS object with the vertexes of the List which are to be marked as traversed as the key
 * edgeTraversed: JS object with the edges of the List which are to be marked as traversed as the key
 */

function createState(iLObject, vertexTraversed, edgeTraversed) {
    if (vertexTraversed == null || vertexTraversed == undefined || !(vertexTraversed instanceof Object))
        vertexTraversed = {};
    if (edgeTraversed == null || edgeTraversed == undefined || !(edgeTraversed instanceof Object))
        edgeTraversed = {};

    var state = {
        "vl": {},
        "el": {}
    };
    var key;

    for (key in iLObject) {
        if (key == "head") continue;

        idx = iLObject[key]["vtxIdx"];

        state["vl"][idx] = {};
        state["vl"][idx]["cx"] = iLObject[key]["cx"];
        state["vl"][idx]["cy"] = iLObject[key]["cy"];
        state["vl"][idx]["text"] = key;
        state["vl"][idx]["state"] = VERTEX_DEFAULT;

        if (iLObject[key]["next"] == null) continue;

        parentChildEdgeId = iLObject[key]["vtxIdx"];

        state["el"][parentChildEdgeId] = {};

        state["el"][parentChildEdgeId]["vertexA"] = iLObject[key]["vtxIdx"];
        state["el"][parentChildEdgeId]["vertexB"] = iLObject[iLObject[key]["next"]]["vtxIdx"];
        state["el"][parentChildEdgeId]["type"] = EDGE_TYPE_DE;
        state["el"][parentChildEdgeId]["weight"] = 1;
        state["el"][parentChildEdgeId]["state"] = EDGE_DEFAULT;
        state["el"][parentChildEdgeId]["animateHighlighted"] = false;

        // add an edge for doubly linked list
        if ((activeStatus == "doublylist") || (activeStatus == "deque")) {
            parentChildEdgeId = iLObject[key]["vtxIdx"] + BACK_EDGE_CONST;
            state["el"][parentChildEdgeId] = {};

            state["el"][parentChildEdgeId]["vertexA"] = iLObject[iLObject[key]["next"]]["vtxIdx"];
            state["el"][parentChildEdgeId]["vertexB"] = iLObject[key]["vtxIdx"];
            state["el"][parentChildEdgeId]["type"] = EDGE_TYPE_DE;
            state["el"][parentChildEdgeId]["weight"] = 1;
            state["el"][parentChildEdgeId]["state"] = EDGE_DEFAULT;
            state["el"][parentChildEdgeId]["animateHighlighted"] = false;
        }
    }

    var cur = iLObject["head"], idx = 0;
    while (cur != null) {
        curIdx = iLObject[cur]["vtxIdx"];
        // state["vl"][curIdx]["extratext"] = idx;
        if (idx == 0) state["vl"][curIdx]["extratext"] = "head";
        else if (iLObject[cur]["next"] == null) state["vl"][curIdx]["extratext"] = "tail";
        cur = iLObject[cur]["next"];
        idx++;
    }

    for (key in vertexTraversed) {
        idx = iLObject[key]["vtxIdx"];
        state["vl"][idx]["state"] = VERTEX_TRAVERSED;
    }

    for (key in edgeTraversed) {
        state["el"][key]["state"] = EDGE_TRAVERSED;
        if (state["el"][key + BACK_EDGE_CONST] != null) state["el"][key + BACK_EDGE_CONST] = EDGE_TRAVERSED;
    }

    return state;
}

// modified recalculateposition
function recalculatePosition() {
    updatePosition(iL["head"]);

    function updatePosition(currentVertex) {
        if (currentVertex == null) return;

        if (activeStatus == "stack") { // relayout vertical
            if (currentVertex == iL["head"])
                iL[currentVertex]["cy"] = 20;
            else {
                var curVtx = iL[currentVertex]["prev"]
                iL[currentVertex]["cy"] = iL[curVtx]["cy"] + 70;
            }
            iL[currentVertex]["cx"] = 350;
        }
        else { // relayout horizontal
            if (currentVertex == iL["head"])
                iL[currentVertex]["cx"] = 50;
            else {
                var curVtx = iL[currentVertex]["prev"];
                iL[currentVertex]["cx"] = iL[curVtx]["cx"] + 80;
            }
            iL[currentVertex]["cy"] = 50;
        }

        updatePosition(iL[currentVertex]["next"]);
    }
}

function populatePseudocode(act) {
    switch (act) {
        case 4: // search
            $('#code1').html('if empty, return NOT_FOUND');
            $('#code2').html('index = 0, temp = head');
            $('#code3').html('while (temp.item != v)');
            $('#code4').html('&nbsp&nbsp' + 'index++, temp = temp.next');
            $('#code5').html('&nbsp&nbspif temp == null');
            $('#code6').html('&nbsp&nbsp&nbsp&nbspreturn NOT_FOUND');
            $('#code7').html('return index');
            break;
        case 3: // peek
            $('#code1').html('if empty, return NOT_FOUND');
            $('#code2').html('return head.item');
            $('#code3').html('');
            $('#code4').html('');
            $('#code5').html('');
            $('#code6').html('');
            $('#code7').html('');
            break;
        case 9: // peek back
            $('#code1').html('if empty, return NOT_FOUND');
            $('#code2').html('return tail.item');
            $('#code3').html('');
            $('#code4').html('');
            $('#code5').html('');
            $('#code6').html('');
            $('#code7').html('');
            break;

        case 1: // insertHead
            $('#code1').html('Vertex vtx = new Vertex(v)');
            $('#code2').html('vtx.next = head');
            if ((activeStatus == "doublylist") || (activeStatus == "deque")) {
                $('#code3').html('if (head != null) head.prev = temp');
                if (amountVertex == 1)
                    $('#code4').html('head = vtx, tail = head');
                else
                    $('#code4').html('head = vtx');
            }
            else if (amountVertex == 1) {
                $('#code3').html('head = vtx, tail = head');
                $('#code4').html('');
            }
            else {
                $('#code3').html('head = vtx');
                $('#code4').html('');
            }
            $('#code5').html('');
            $('#code6').html('');
            $('#code7').html('');
            break;
        case 2: // insertTail
            $('#code1').html('Vertex vtx = new Vertex(v)');
            if ((activeStatus == "doublylist") || (activeStatus == "deque"))
                $('#code2').html('tail.next = temp, temp.prev = tail');
            else
                $('#code2').html('tail.next = vtx');
            $('#code3').html('tail = vtx');
            $('#code4').html('');
            $('#code5').html('');
            $('#code6').html('');
            $('#code7').html('');
            break;
        case 0: // Insert
            $('#code1').html('Vertex pre = head');
            $('#code2').html('for (k = 0; k < i-1; k++)');
            $('#code3').html('&nbsp&nbsp' + 'pre = pre.next');
            $('#code4').html('Vertex aft = pre.next');
            $('#code5').html('Vertex vtx = new Vertex(v)');
            if ((activeStatus == "doublylist") || (activeStatus == "deque")) {
                $('#code6').html('vtx.next = aft, aft.prev = vtx');
                $('#code7').html('pre.next = vtx, vtx.prev = pre');
            }
            else {
                $('#code6').html('vtx.next = aft');
                $('#code7').html('pre.next = vtx');
            }
            break;

        case 5: // remove head
            $('#code1').html('if empty, do nothing');
            $('#code2').html('temp = head');
            $('#code3').html('head = head.next');
            $('#code4').html('delete temp');
            if ((activeStatus == "doublylist") || (activeStatus == "deque"))
                $('#code5').html('if (head != null) head.prev = null');
            else
                $('#code5').html('');
            $('#code6').html('');
            $('#code7').html('');
            break;
        case 6: // remove tail (SLL)
            $('#code1').html('if empty, do nothing');
            $('#code2').html('Vertex pre = head');
            $('#code3').html('temp = head.next');
            $('#code4').html('while (temp.next != null)');
            $('#code5').html('&nbsp&nbsp' + 'pre = pre.next');
            $('#code6').html('pre.next = null');
            $('#code7').html('delete temp, tail = pre');
            break;
        case 7: // remove kth
            $('#code1').html('if empty, do nothing');
            $('#code2').html('Vertex pre = head');
            $('#code3').html('for (k = 0; k < i-1; k++)');
            $('#code4').html('&nbsp&nbsp' + 'pre = pre.next');
            $('#code5').html('Vertex del = pre.next, aft = del.next');
            if ((activeStatus == "doublylist") || (activeStatus == "deque"))
                $('#code6').html('pre.next = aft, aft.prev = pre');
            else
                $('#code6').html('pre.next = aft // bypass del');
            $('#code7').html('delete del');
            break;
        case 8: // remove tail (DLL, easier)
            $('#code1').html('if empty, do nothing');
            $('#code2').html('temp = tail');
            $('#code3').html('tail = tail.prev');
            $('#code4').html('tail.next = null');
            $('#code5').html('delete temp');
            $('#code6').html('');
            $('#code7').html('');
            break;
    }
}

// List actions
// actions panel stuff
var actionsWidth;
var statusCodetraceWidth;
var isCreateOpen = false, isSearchOpen = false, isInsertOpen = false, isRemoveOpen = false;

function openCreate() {
    $(".create").css("top", "690px");
    $('#createfixedsize-input').hide();
    $('#createuserdefined-input').hide();
    if (!isCreateOpen) {
        $('.create').fadeIn('fast');
        isCreateOpen = true;
    }
}

function closeCreate() {
    if (isCreateOpen) {
        $('.create').fadeOut('fast');
        $('#create-err').html("");
        isCreateOpen = false;
    }
}

function openSearch() {
    if (!isSearchOpen) {
        $(".search").css("top", "720px");
        $('.search').fadeIn('fast');
        isSearchOpen = true;
    }
}

function closeSearch() {
    if (isSearchOpen) {
        $('.search').fadeOut('fast');
        $('#search-err').html("");
        isSearchOpen = false;
    }
}

function openInsert() {
    $(".insert").css("top", "750px");
    $('#insertkth-input').hide();
    $('#inserthead-input').hide();
    $('#inserttail-input').hide();
    if (!isInsertOpen) {
        $('.insert').fadeIn('fast');
        isInsertOpen = true;
    }
}

function closeInsert() {
    if (isInsertOpen) {
        $('.insert').fadeOut('fast');
        $('#insert-err').html("");
        isInsertOpen = false;
    }
}

function openRemove() {
    $(".remove").css("top", "780px");
    $('#removekth-input').hide();
    if (!isRemoveOpen) {
        $('.remove').fadeIn('fast');
        isRemoveOpen = true;
    }
}

function closeRemove() {
    if (isRemoveOpen) {
        $('.remove').fadeOut('fast');
        $('#remove-err').html("");
        isRemoveOpen = false;
    }
}

var noteTitle = document.getElementById('noteTitle');
var note = document.getElementById('noteContent');

$('#title-LL').click(function () {
    displayList();
    changeTextList();
    lw.setActiveStatus("list");
    title.innerHTML = "Single Linked List";
    noteTitle.innerHTML = '<h1>Danh sách liên kết đơn</h1>';
    note.innerHTML = "<div>Danh sách được liên kết đơn là một chuỗi các cấu trúc dữ liệu, được kết nối với nhau thông qua các liên kết.\n" +
        "Danh sách liên kết là một chuỗi các liên kết chứa các mục. Mỗi liên kết chứa một kết nối(Next Link) đến liên kết khác. \n" +
        "Danh sách được liên kết là cấu trúc dữ liệu được dùng nhiều thứ hai sau mảng.</div>"
    clearConsole();

});
$('#title-DLL').click(function () {

    displayList();
    changeTextDoublyList();
    lw.setActiveStatus("doublylist");
    title.innerHTML = "Doubly Linked List";
    noteTitle.innerHTML = '<h1>Danh sách liên kết đôi</h1>';
    note.innerHTML = "<div>Danh sách được liên kết gấp đôi là một biến thể của Danh sách được liên kết trong đó có thể điều hướng theo cả hai cách, " +
        "dễ dàng chuyển tiếp hoặc lùi lại so với Danh sách được liên kết đơn" +
        "Danh sách liên kết đôi chứa một phần tử link và được gọi là First và Last.<br>" +
        "Mỗi link mang một trường dữ liệu và một trường link được gọi là Next.<br>" +
        "Mỗi link được liên kết với phần tử kế tiếp bởi sử dụng Next Link.<br>" +
        "Mỗi link được liên kết với phần tử phía trước bởi sử dụng Prev Link.<br>" +
        "Last Link mang một link trỏ tới NULL để đánh dầu phần cuối của Danh sách liên kết.</div>"
    clearConsole();
});

var lw = new List(), gw;

$(function () {
    $('#play').hide();
    gw = lw.getGraphWidget();
    var five_modes = ["LL", "DLL"];
    $('#title-' + five_modes[Math.floor(Math.random() * 2)]).click(); // randomly open one of the five default example every time

    var llMode = getQueryVariable("mode");
    if (llMode.length > 0) {
        $('#title-' + llMode).click();
    }
    var createLL = getQueryVariable("create");
    if (createLL.length > 0) {
        var newLL = createLL.split(",");
        lw.generate(newLL);
    }
    var operation = getQueryVariable("operation");
    var operationValue = getQueryVariable("operationValue");
    var operationMode = getQueryVariable("operationMode");
    if (operation.length > 0) {
        switch (operation) {
            case "insert":
                openInsert();
                insertModelingOpen(operationMode);
                $("#" + operationMode + "-input input").val(operationValue);
        }
    }

    $('#create').click(function () {
        closeSearch();
        closeInsert();
        closeRemove();
        openCreate();
    });

    $('#search').click(function () {
        closeCreate();
        closeInsert();
        closeRemove();
        openSearch();
    });

    $('#insert').click(function () {
        closeCreate();
        closeSearch();
        closeRemove();
        openInsert();
    });

    $('#remove').click(function () {
        closeCreate();
        closeSearch();
        closeInsert();
        openRemove();
    });
});

function allOff() {
    $("#search-input").css("display", "none");
    $("#search-go").css("display", "none");
    $("#search-peek-front").css("display", "none");
    $("#search-peek-back").css("display", "none");

    $("#insert-head").css("display", "none");
    $("#insert-tail").css("display", "none");
    $("#insert-kth").css("display", "none");
    $("#pushtop-input").css("display", "none");
    $("#pushtop-go").css("display", "none");
    $("#enqueueback-input").css("display", "none");
    $("#enqueueback-go").css("display", "none");
    $("#insert-deque-input").css("display", "none");
    $("#insert-deque-front").css("display", "none");
    $("#insert-deque-back").css("display", "none");

    $("#remove-head").css("display", "none");
    $("#remove-tail").css("display", "none");
    $("#remove-kth").css("display", "none");
    $("#remove-deque-front").css("display", "none");
    $("#remove-deque-back").css("display", "none");
}

function displayList() {
    allOff();

    $("#search-input").css("display", "");
    $("#search-go").css("display", "");

    $("#insert-head").css("display", "");
    $("#insert-tail").css("display", "");
    $("#insert-kth").css("display", "");

    $("#remove-head").css("display", "");
    $("#remove-tail").css("display", "");
    $("#remove-kth").css("display", "");
}


function changeTextList() {
    $("#create").text('Create');
    $("#search").text('Search');
    $("#insert").text('Insert');
    $("#remove").text('Remove');
}


function changeTextDoublyList() {
    $("#create").text('Create');
    $("#search").text('Search');
    $("#insert").text('Insert');
    $("#remove").text('Remove');
}

function empty() {
    if (isPlaying) stop();
    if (lw.generateRandomFixedSize(0)) {
        $('#progress-bar').slider("option", "max", 0);
        closeCreate();
        isPlaying = false;
    }
    hideStatusPanel();
    hideCodetracePanel();
}

function random() {
    if (isPlaying) stop();
    if (lw.generateRandom(false)) {
        $('#progress-bar').slider("option", "max", 0);
        closeCreate();
        isPlaying = false;
    }
    hideStatusPanel();
    hideCodetracePanel();
}

function randomSorted() {
    if (isPlaying) stop();
    if (lw.generateRandom(true)) {
        $('#progress-bar').slider("option", "max", 0);
        closeCreate();
        isPlaying = false;
    }
    hideStatusPanel();
    hideCodetracePanel();
}

function randomFixedSize() {
    if (isPlaying) stop();
    var input = $('#v-create-size').val();
    input = parseInt(input);
    if (lw.generateRandomFixedSize(input)) {
        $('#progress-bar').slider("option", "max", 0);
        closeCreate();
        isPlaying = false;
    }
    hideStatusPanel();
    hideCodetracePanel();
}

function nonRandom() {
    if (isPlaying) stop();
    var input = $('#v-create-arr').val();
    input = input.split(",");
    if (lw.generateUserDefined(input)) {
        $('#progress-bar').slider("option", "max", 0);
        closeCreate();
        isPlaying = false;
    }
    hideStatusPanel();
    hideCodetracePanel();
}

function searchVertex(callback) {
    if (isPlaying) stop();
    var input = parseInt($('#v-search').val());
    commonAction(lw.search(input, callback), "Search " + input);
    setTimeout(function () {
        if (Math.random() > 0.5) // 50% chance totally random
            $('#v-search').val(1 + Math.floor(Math.random() * 99));
        else { // 50% something that is inside the list
            var a = lw.getA();
            $('#v-search').val(a[Math.floor(Math.random() * a.length)]);
        }
    }, 500);
}

function peekStack(callback) {
    if (isPlaying) stop();
    commonAction(lw.peek(true, callback), 'Peek top (head)');
}

function peekQueue(callback) {
    if (isPlaying) stop();
    commonAction(lw.peek(true, callback), 'Peek front (head)');
}

function searchGeneric(callback) {
    if (lw.getActiveStatus() == "stack")
        peekStack(callback);
    else if (lw.getActiveStatus() == "queue")
        peekQueue(callback);
}

function insertHead(callback) {
    if (isPlaying) stop();
    var input = parseInt($('#v-insert-head-value').val());
    commonAction(lw.insertHead(input, callback), 'Insert {input} at head'.replace("{input}", input));
    setTimeout(function () {
        $('#v-insert-head-value').val(1 + Math.floor(Math.random() * 99));
    }, 500);
}

function insertTail(callback) {
    if (isPlaying) stop();
    var input = parseInt($('#v-insert-tail-value').val());
    commonAction(lw.insertTail(input, callback), 'Insert {input} at tail'.replace("{input}", input));
    setTimeout(function () {
        $('#v-insert-tail-value').val(1 + Math.floor(Math.random() * 99));
    }, 500);
}

function insertKth(callback) {
    if (isPlaying) stop();
    var index = parseInt($('#v-insert-kth').val());
    var input = parseInt($('#v-insert-kth-value').val());
    commonAction(lw.insertKth(index, input, callback), 'Insert {input} at index {index}'.replace("{input}", input).replace("{index}", index));
    setTimeout(function () {
        $('#v-insert-kth').val(1 + Math.floor(Math.random() * (lw.getN() - 1))); // [1..N-1]
        $('#v-insert-kth-value').val(1 + Math.floor(Math.random() * 99));
    }, 500);
}

function pushTop(callback) {
    if (isPlaying) stop();
    var input = $('#v-push-top-value').val();
    commonAction(lw.insertHead(input, callback), 'Push {input} at top (head)'.replace("{input}", input));
    setTimeout(function () {
        $('#v-push-top-value').val(1 + Math.floor(Math.random() * 99));
    }, 500);
}

function enqueueBack(callback) {
    if (isPlaying) stop();
    var input = $('#v-enqueue-back-value').val();
    commonAction(lw.insertTail(input, callback), 'Enqueue {input} at back (tail)'.replace("{input}", input));
    setTimeout(function () {
        $('#v-enqueue-back-value').val(1 + Math.floor(Math.random() * 99));
    }, 500);
}

function removeHead(callback) { // PS both pop/stack and dequeue/queue also calls the same thing: remove head
    if (isPlaying) stop();
    commonAction(lw.removeHead(callback), 'Remove i = 0 (Head)');
}

function removeTail(callback) {
    if (isPlaying) stop();
    if (lw.getActiveStatus() == "doublylist" || lw.getActiveStatus() == "deque")
        commonAction(lw.removeTailDLL(callback), 'Remove i = N-1 (Tail)');
    else
        commonAction(lw.removeTail(callback), 'Remove i = N-1 (Tail)');
}

function removeKth(callback) {
    if (isPlaying) stop();
    var input = parseInt($('#v-remove-kth').val());
    commonAction(lw.removeKth(input, callback), 'Remove index {input}'.replace("{input}", input));
    setTimeout(function () {
        $('#v-remove-kth').val(1 + Math.floor(Math.random() * (lw.getN() - 2)));
    }, 500); // [1..N-2]
}


function insertModelingOpen(modelingType) {
    $(".insert").css("bottom", "65px");
    if (modelingType != "insertkth")
        $('#insertkth-input').fadeOut('fast');
    if (modelingType != "inserthead")
        $('#inserthead-input').fadeOut('fast');
    if (modelingType != "inserttail")
        $('#inserttail-input').fadeOut('fast');
    $('#' + modelingType + '-input').fadeIn('fast');
}
