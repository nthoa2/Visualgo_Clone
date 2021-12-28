var BST = function () {
    var self = this;
    var gw = new GraphWidget();
    var isAVL = false;

    var valueRange = [1, 100]; // Range of valid values of BST vertexes allowed
    var maxHeightAllowed = 9; // max 9 edges (10 vertices)

    var initialArray = [15, 6, 23, 4, 7, 71, 5, 50];
    var initialAvlArray = [15, 6, 50, 4, 7, 23, 71, 5];

    var iBST = {};
    var amountVertex = 0;
    iBST["root"] = null;

    if (isAVL) init(initialAvlArray);
    else init(initialArray);

    this.getGraphWidget = function () {
        return gw;
    };

    function dummyInit() {
        iBST["root"] = 15;
        iBST[15] = {
            "parent": null,
            "leftChild": 6,
            "rightChild": 23,
            "vertexClassNumber": 0
        };
        iBST[6] = {
            "parent": 15,
            "leftChild": 4,
            "rightChild": 7,
            "vertexClassNumber": 1
        };
        iBST[23] = {
            "parent": 15,
            "leftChild": null,
            "rightChild": 71,
            "vertexClassNumber": 2
        };
        iBST[4] = {
            "parent": 6,
            "leftChild": null,
            "rightChild": 5,
            "vertexClassNumber": 3
        };
        iBST[7] = {
            "parent": 6,
            "leftChild": null,
            "rightChild": null,
            "vertexClassNumber": 4
        };
        iBST[71] = {
            "parent": 23,
            "leftChild": 50,
            "rightChild": null,
            "vertexClassNumber": 5
        };
        iBST[5] = {
            "parent": 4,
            "leftChild": null,
            "rightChild": null,
            "vertexClassNumber": 6
        };
        iBST[50] = {
            "parent": 71,
            "leftChild": null,
            "rightChild": null,
            "vertexClassNumber": 7
        };

        $('#status').bind("DOMSubtreeModified", function () {
            $('#console').append($('#status').html());
        });




        var key;
        recalculatePosition();

        for (key in iBST) {
            if (key == "root")
                continue;

            var cur = iBST[key];
            gw.addVertex(cur["cx"], cur["cy"], key, cur["vertexClassNumber"], true);
        }

        for (key in iBST) {
            if (key == "root")
                continue;

            var cur = iBST[key];
            var parentVertex = iBST[cur["parent"]];
            if (cur["parent"] == null)
                continue;

            gw.addEdge(parentVertex["vertexClassNumber"], cur["vertexClassNumber"], cur["vertexClassNumber"], EDGE_TYPE_UDE, 1, true);
        }

        amountVertex = 8;
    }

    this.generate = function (array) {
        init(array);
    };

    this.generateEmpty = function () {
        var vertexAmt = 0;
        var initArr = [];
        init(initArr);
        return true;
    };


    this.generateExample = function (id) {
        var drawArray = getTreeArray();
        if (isAVL && (id == 1)) {
            $('#create-err').html("AVL trees are balanced. This example is not balanced.");
            return false;
        }
        let vertexAmt = 8; // for id == 1
        let initArr = [15, 6, 23, 4, 7, 71, 5, 50];
        if (id == 2) {
            vertexAmt = 10;
            initArr = [41, 20, 65, 11, 29, 50, 91, 32, 72, 99];
        }
        else if (id == 3) {
            vertexAmt = 15;
            initArr = [8, 4, 12, 2, 6, 10, 14, 1, 3, 5, 7, 9, 11, 13, 15];
        }
        else if (id == 4) {
            vertexAmt = 12;
            initArr = [8, 6, 16, 3, 7, 13, 19, 2, 11, 15, 18, 10];
        }
        else if (id == 5) {
            vertexAmt = 20;
            initArr = [13, 8, 18, 5, 11, 16, 20, 3, 7, 10, 12, 15, 17, 19, 2, 4, 6, 9, 14, 1];
        }else if(id == 6){
            vertexAmt = drawArray.length;
            initArr = drawArray;
        }

        init(initArr);
        return true;
    }

    this.generateRandom = function () {
        var vertexAmt = Math.floor((Math.random() * 7 + 5));
        var initArr = [];

        while (initArr.length < vertexAmt) {
            var random = Math.floor(1 + Math.random() * 99);
            if ($.inArray(random, initArr) < 0)
                initArr.push(random);
        }

        if (isAVL) {
            var initArrAvl = [];

            function recursion(startVal, endVal) {
                var total = startVal + endVal + 1;
                if (total < 1)
                    return;
                if (startVal > endVal)
                    return;
                if (total == 1)
                    initArrAvl.push(initArr[startVal]);
                else if (total % 2 != 0) {
                    initArrAvl.push(initArr[parseInt(total / 2)]);
                    recursion(startVal, parseInt(total / 2) - 1);
                    recursion(parseInt(total / 2) + 1, endVal);
                }
                else {
                    initArrAvl.push(initArr[parseInt(total / 2) - 1]);
                    recursion(startVal, parseInt(total / 2) - 2);
                    recursion(parseInt(total / 2), endVal);
                }
            }

            function sortNumber(a, b) {
                return a - b;
            }

            initArr.sort(sortNumber);
            recursion(0, initArr.length - 1);
            init(initArrAvl);
        }
        else
            init(initArr);

        return true;
    }

    this.generateSkewed = function (side) {
        if (isAVL) {
            $('#create-err').html('Các cây AVL không bị lệch. Chọn tiêu đề TỐT NHẤT để sử dụng tác vụ này.');
            return false;
        }
        else {
            var vertexAmt = Math.floor(5 + Math.random() * 5); // [5..9] vertices (allow +1 for one more right/left extreme insertion)
            var initArr = new Array();
            while (initArr.length < vertexAmt) {
                var random = Math.floor(1 + Math.random() * 99); // value [1..99]
                if ($.inArray(random, initArr) < 0)
                    initArr.push(random);
            }
            if (side == "left") {
                initArr.sort(function (a, b) {
                    return b - a;
                });
            }
            else if (side == "right") {
                initArr.sort(function (a, b) {
                    return a - b;
                });
            }
            init(initArr);
            return true;
        }
    };

    this.isAVL = function (bool) {
        if (typeof bool != 'boolean') return;

        if (bool != isAVL) {
            clearScreen();
            if (bool)
                init(initialAvlArray);
            else
                init(initialArray);
            isAVL = bool;
        }
    };

    this.getIsAVL = function () {
        return isAVL;
    };

    this.getRandomInBST = function () {
        var arr = new Array();
        for (var key in iBST) {
            if (key == "root") continue;
            arr.push(key);
        }
        return parseInt(arr[Math.floor(Math.random() * arr.length)]);
    }

    this.getRandomNotInBST = function () {
        var arr = new Array();
        for (var key in iBST) {
            if (key == "root") continue;
            arr.push(parseInt(key));
        }
        var candidate = 1 + Math.floor(Math.random() * 99); // [1..99]
        while ($.inArray(candidate, arr) > 0)
            candidate = 1 + Math.floor(Math.random() * 99);
        return candidate;
    }

    this.search = function (val, callback) {
        var sl = [], vertexTraversed = {}, edgeTraversed = {}, cur = iBST["root"], cs, currentVertexClass, key, ans;

        cs = createState(iBST);
        //cs["status"] = "Cây BST hiện tại";  //status_search_0
        cs["status"] = 'Cây BST hiện tại.';
        cs["lineNo"] = 0;
        sl.push(cs);

        while (cur != val && cur != null) {
            cs = createState(iBST, vertexTraversed, edgeTraversed);
            currentVertexClass = iBST[cur]["vertexClassNumber"];
            cs["vl"][currentVertexClass]["state"] = VERTEX_HIGHLIGHTED;
            vertexTraversed[cur] = true;
            //cs["status"] = "So sánh " + cur + " with " + val + "."; //status_search_1
            cs["status"] = 'So sánh  {cur} với {val}.'.replace("{cur}", cur).replace("{val}", val);
            cs["lineNo"] = 3;
            sl.push(cs);

            if (parseInt(val) > parseInt(cur)) {
                cs = createState(iBST, vertexTraversed, edgeTraversed);
                //cs["status"] = cur + " is smaller than " + val + "."; //status_search_2
                cs["status"] = '{cur} nhỏ hơn {val}.'.replace("{cur}", cur).replace("{val}", val);
                cs["lineNo"] = 5;
                sl.push(cs);

                cur = iBST[cur]["rightChild"];
                if (cur == null) {
                    cs = createState(iBST, vertexTraversed, edgeTraversed);
                    //cs["status"] = "Value " + val + " không có trong BST."; //status_search_3
                    cs["status"] = 'Giá trị {val} không tồn tại trong cây BST.'.replace("{val}", val);
                    cs["lineNo"] = [1, 2];
                    sl.push(cs);
                    break;
                }

                cs = createState(iBST, vertexTraversed, edgeTraversed);
                var edgeHighlighted = iBST[cur]["vertexClassNumber"];
                edgeTraversed[edgeHighlighted] = true;
                cs["el"][edgeHighlighted]["animateHighlighted"] = true;
                cs["el"][edgeHighlighted]["state"] = EDGE_TRAVERSED;
                cs["status"] = 'Vì vậy, tiếp tục tìm kiếm ở bên phải.';
                cs["lineNo"] = 6;
                sl.push(cs);
            }
            else {
                cs = createState(iBST, vertexTraversed, edgeTraversed);
                cs["status"] = '{cur} lớn hơn {val}.'.replace("{cur}", cur).replace("{val}", val);
                cs["lineNo"] = 7;
                sl.push(cs);

                cur = iBST[cur]["leftChild"];
                if (cur == null) {
                    cs = createState(iBST, vertexTraversed, edgeTraversed);
                    cs["status"] = 'Giá trị {val} không có trong BST.'.replace("{val}", val);
                    cs["lineNo"] = [1, 2];
                    sl.push(cs);
                    break;
                }

                cs = createState(iBST, vertexTraversed, edgeTraversed);
                var edgeHighlighted = iBST[cur]["vertexClassNumber"];
                edgeTraversed[edgeHighlighted] = true;
                cs["el"][edgeHighlighted]["animateHighlighted"] = true;
                cs["el"][edgeHighlighted]["state"] = EDGE_TRAVERSED;
                cs["status"] = 'Vì vậy, tiếp tục tìm kiếm bên trái.';
                cs["lineNo"] = 7;
                sl.push(cs);
            }
        }

        if (cur != null) {
            cs = createState(iBST, vertexTraversed, edgeTraversed);
            currentVertexClass = iBST[cur]["vertexClassNumber"];
            cs["vl"][currentVertexClass]["state"] = VERTEX_HIGHLIGHTED;
            cs["status"] = 'Tìm thấy giá trị {val}.'.replace("{val}", val);
            cs["lineNo"] = 4;
            sl.push(cs);
        }

        gw.startAnimation(sl, callback);
        populatePseudocode(4);
        return true;
    }

    this.findMax = function () {
        var ans = -1;
        for (key in iBST) {
            if (key == "root") continue;
            ans = Math.max(ans, key);
        }
        return ans;
    }

    this.findMinMax = function (isMin, callback) {
        var sl = [], vertexTraversed = {}, edgeTraversed = {}, cur = iBST["root"], cs, key, ans;

        cs = createState(iBST);
        cs["status"] = 'Cây BST hiện tại';
        cs["lineNo"] = 0;
        sl.push(cs);

        if (cur == null) {
            cs = createState(iBST);
            if (isMin) {
                cs["status"] = 'Cây trống, không có giá trị nhỏ nhất.';
            }
            else {
                cs["status"] = 'Cây trống, không có giá trị lớn nhất..';
            }
            cs["lineNo"] = 1;
            sl.push(cs);
            gw.startAnimation(sl, callback);
            return true;
        }

        while (cur != null) {
            cs = createState(iBST, vertexTraversed, edgeTraversed);
            key = iBST[cur]["vertexClassNumber"];
            cs["vl"][key]["state"] = VERTEX_HIGHLIGHTED;
            vertexTraversed[cur] = true;
            if ((isMin && (iBST[cur]["leftChild"] != null)) ||
                (!isMin && (iBST[cur]["rightChild"] != null))) {
                if (isMin) {
                    cs["status"] = '{cur} không phải là giá trị nhỏ nhất vì nó có con bên trái.'.replace("{cur}", cur);
                }
                else {
                    cs["status"] = '{cur} không phải là giá trị lớn nhất vì nó có một con bên phải.'.replace("{cur}", cur);
                }
                cs["lineNo"] = 2;
            }
            else {
                ans = cur;
                if (isMin) {
                    cs["status"] = 'Giá trị nhỏ nhất được tìm thấy!';
                }
                else {
                    cs["status"] = 'Giá trị lớn nhất được tìm thấy!';
                }

                cs["lineNo"] = 4;
            }
            cur = (isMin ? iBST[cur]["leftChild"] : iBST[cur]["rightChild"]);
            sl.push(cs);

            if (cur == null) break;

            cs = createState(iBST, vertexTraversed, edgeTraversed);
            var edgeHighlighted = iBST[cur]["vertexClassNumber"];
            edgeTraversed[edgeHighlighted] = true;
            cs["el"][edgeHighlighted]["animateHighlighted"] = true;
            cs["el"][edgeHighlighted]["state"] = EDGE_TRAVERSED;
            if (isMin) {
                cs["status"] = 'Chuyển sang trái để kiểm tra giá trị nhỏ hơn ...';
            }
            else {
                cs["status"] = 'Chuyển sang phải để kiểm tra giá trị lớn hơn ...';
            }

            cs["lineNo"] = 3;
            sl.push(cs);
        }

        cs = createState(iBST);
        if (isMin) {
            cs["status"] = 'Tìm Min đã kết thúc. <br> Giá trị nhỏ nhất là {ans}.'.replace("{ans}", ans);
        }
        else {
            cs["status"] = 'Tìm Max đã kết thúc. <br> Giá trị lớn nhất là {ans}.'.replace("{ans}", ans);
        }

        cs["lineNo"] = 0;
        sl.push(cs);

        populatePseudocode(isMin ? 2 : 1);
        gw.startAnimation(sl, callback);
        return true;
    }



    this.insertArr = function (vertexTextArr, callback) {
        var sl = [], vertexTraversed = {}, edgeTraversed = {}, cur = iBST["root"], cs, key, currentVertexClass, i;

        cs = createState(iBST);
        cs["status"] = 'Cây BST hiện tại.';
        cs["lineNo"] = 0;
        sl.push(cs);

        // Check whether input is array
        if (Object.prototype.toString.call(vertexTextArr) != '[object Array]') {
            $('#insert-err').html('Hãy điền vào một số hoặc mảng số được phân tách bằng dấu phẩy!');
            return false;
        }

        // Loop through all array values and...
        var tempiBST = deepCopy(iBST); // Use this to simulate internal insertion

        for (i = 0; i < vertexTextArr.length; i++) {
            var vt = parseInt(vertexTextArr[i]);

            // 1. Check whether value is number
            if (isNaN(vt)) {
                $('#insert-err').html('Hãy điền vào một số hoặc mảng số được phân tách bằng dấu phẩy!');
                return false;
            }

            // 2. No duplicates allowed. Also works if more than one similar value are inserted
            if (tempiBST[vt] != null) {
                $('#insert-err').html('Không cho phép đỉnh trùng lặp!');
                if (typeof callback == 'function') callback();
                return false;
            }

            // 3. Check range
            if (parseInt(vt) < valueRange[0] || parseInt(vt) > valueRange[1]) {
                $('#insert-err').html('Xin lỗi, chỉ những giá trị giữa {range1} và {range2} có thẻ chèn được'.replace("{range1}", valueRange[0]).replace("{range2}", valueRange[1]));
                return false;
            }

            // 4. Insert the node into temporary internal structure and check for height
            var parentVertex = tempiBST["root"];
            var heightCounter = 0;

            if (parentVertex == null) {
                tempiBST["root"] = parseInt(vt);
                tempiBST[vt] = {
                    "parent": null,
                    "leftChild": null,
                    "rightChild": null
                };
            }
            else {
                while (true) {
                    heightCounter++;
                    if (parentVertex < vt) {
                        if (tempiBST[parentVertex]["rightChild"] == null)
                            break;
                        parentVertex = tempiBST[parentVertex]["rightChild"];
                    }
                    else {
                        if (tempiBST[parentVertex]["leftChild"] == null)
                            break;
                        parentVertex = tempiBST[parentVertex]["leftChild"];
                    }
                }

                if (parentVertex < vt)
                    tempiBST[parentVertex]["rightChild"] = vt;
                else
                    tempiBST[parentVertex]["leftChild"] = vt;

                tempiBST[vt] = {
                    "parent": parentVertex,
                    "leftChild": null,
                    "rightChild": null
                }
            }

            heightCounter++; // New vertex added will add new height

            if (heightCounter > maxHeightAllowed + 1) {
                $('#insert-err').html('Xin lỗi, chỉ có thể thao tác cây có chiều cao tối đa {maxHeight}'.replace("{maxHeight}", maxHeightAllowed));
                if (typeof callback == 'function') callback();
                return false;
            }
        }

        function checkNewHeight() {
            var parentVertex = tempiBST["root"];
            var heightCounter = 0;

            while (parentVertex != null) {
                if (parentVertex < parseInt(val))
                    parentVertex = tempiBST[parentVertex]["rightChild"];
                else
                    parentVertex = tempiBST[parentVertex]["leftChild"];
                heightCounter++;
            }

            heightCounter++; // New vertex added will add new height

            if (heightCounter > maxHeightAllowed + 1)
                return false;
            return true;
        }

        for (i = 0; i < vertexTextArr.length; i++) {
            var val = parseInt(vertexTextArr[i]);

            // Re-initialization
            vertexTraversed = {};
            edgeTraversed = {};
            cur = iBST["root"];
            cs = createState(iBST);

            // Find parent
            while (cur != val && cur != null) {
                cs = createState(iBST, vertexTraversed, edgeTraversed);
                currentVertexClass = iBST[cur]["vertexClassNumber"];

                cs["vl"][currentVertexClass]["state"] = VERTEX_HIGHLIGHTED;

                vertexTraversed[cur] = true;
                cs["status"] = 'So sánh {val} với {cur}'.replace("{val}", val).replace("{cur}", cur);
                if (!isAVL) cs["lineNo"] = 3;
                else cs["lineNo"] = 1;

                sl.push(cs);

                var nextVertex;
                if (parseInt(val) > parseInt(cur))
                    nextVertex = iBST[cur]["rightChild"];
                else
                    nextVertex = iBST[cur]["leftChild"];

                if (nextVertex == null)
                    break;
                else
                    cur = nextVertex;

                cs = createState(iBST, vertexTraversed, edgeTraversed);

                var edgeHighlighted = iBST[cur]["vertexClassNumber"];
                edgeTraversed[edgeHighlighted] = true;

                cs["el"][edgeHighlighted]["animateHighlighted"] = true;
                cs["el"][edgeHighlighted]["state"] = EDGE_TRAVERSED;

                if (parseInt(val) > parseInt(iBST[cur]["parent"])) {
                    cs["status"] = '{val} lớn hơn {parent}, => sang phải.'.replace("{val}", val).replace("{parent}", iBST[cur]["parent"]);
                    if (!isAVL) cs["lineNo"] = 5;
                    else cs["lineNo"] = 1;
                }
                else {
                    cs["status"] = '{val} nhỏ hơn {parent}, => sang trái.'.replace("{val}", val).replace("{parent}", iBST[cur]["parent"]);
                    if (!isAVL) cs["lineNo"] = 4;
                    else cs["lineNo"] = 1;
                }

                sl.push(cs);
            }

            // Begin insertion
            // First, update internal representation
            iBST[parseInt(val)] = {
                "leftChild": null,
                "rightChild": null,
                "vertexClassNumber": amountVertex
            };

            if (cur != null) {
                iBST[parseInt(val)]["parent"] = cur;
                if (cur < parseInt(val))
                    iBST[cur]["rightChild"] = parseInt(val);
                else
                    iBST[cur]["leftChild"] = parseInt(val);
            }

            else {
                iBST[parseInt(val)]["parent"] = null;
                iBST["root"] = parseInt(val);
            }

            amountVertex++;
            recalculatePosition();

            // Then, draw edge
            var newNodeVertexClass = iBST[parseInt(val)]["vertexClassNumber"];

            if (cur != null) {
                cs = createState(iBST, vertexTraversed, edgeTraversed);
                cs["vl"][newNodeVertexClass]["state"] = OBJ_HIDDEN;

                cs["el"][newNodeVertexClass]["state"] = EDGE_TRAVERSED;
                cs["el"][newNodeVertexClass]["animateHighlighted"] = true;
                cs["status"] = 'Vị trí được tìm thấy!<br>Inserting {val}.'.replace("{val}", val);
                cs["lineNo"] = 1;
                sl.push(cs);
                edgeTraversed[newNodeVertexClass] = true;
            }

            // Lastly, draw vertex
            cs = createState(iBST, vertexTraversed, edgeTraversed);
            cs["vl"][newNodeVertexClass]["state"] = EDGE_HIGHLIGHTED;

            cs["status"] = '{val} đã dược chèn vào !'.replace("{val}", val);
            if (!isAVL) cs["lineNo"] = 2;
            else cs["lineNo"] = 1;
            sl.push(cs);

            // End State
            cs = createState(iBST);
            cs["status"] = 'Chèn {val}  đã được hoàn thành.'.replace("{val}", val);
            if (isAVL) cs["lineNo"] = 1;
            sl.push(cs);

            if (isAVL) {
                recalculateBalanceFactor();

                var vertexCheckBf = iBST[val]["parent"];
                while (vertexCheckBf != null) {
                    var vertexCheckBfClass = iBST[vertexCheckBf]["vertexClassNumber"];
                    var bf = iBST[vertexCheckBf]["balanceFactor"];

                    cs = createState(iBST);
                    cs["vl"][vertexCheckBfClass]["state"] = VERTEX_HIGHLIGHTED;
                    cs["status"] = 'Hệ số cân bằng của {vertexCheckBf} là {bf}.'.replace("{vertexCheckBf}", vertexCheckBf).replace("{bf}", bf);
                    cs["lineNo"] = 2;
                    sl.push(cs);

                    if (bf == 2) {
                        var vertexCheckBfLeft = iBST[vertexCheckBf]["leftChild"];
                        var vertexCheckBfLeftClass = iBST[vertexCheckBfLeft]["vertexClassNumber"];
                        var bfLeft = iBST[vertexCheckBfLeft]["balanceFactor"];

                        cs = createState(iBST);
                        cs["vl"][vertexCheckBfClass]["state"] = VERTEX_HIGHLIGHTED;
                        cs["vl"][vertexCheckBfLeftClass]["state"] = VERTEX_HIGHLIGHTED;
                        cs["status"] = 'Và hệ số cân bằng của {vertexCheckBf} là {bf}.'.replace("{vertexCheckBf}", vertexCheckBfLeft).replace("{bf}", bfLeft);
                        cs["lineNo"] = 2;
                        sl.push(cs);

                        if (bfLeft == 1 || bfLeft == 0) {
                            rotateRight(vertexCheckBf);

                            cs = createState(iBST);
                            cs["vl"][vertexCheckBfClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["vl"][vertexCheckBfLeftClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["el"][vertexCheckBfClass]["state"] = EDGE_HIGHLIGHTED;
                            if (iBST["root"] != vertexCheckBfLeft)
                                cs["el"][vertexCheckBfLeftClass]["state"] = EDGE_HIGHLIGHTED;
                            cs["status"] = 'Xoay phải {vertexCheckBf}.'.replace("{vertexCheckBf}", vertexCheckBf);
                            cs["lineNo"] = 3;
                            sl.push(cs);

                            recalculatePosition();

                            cs = createState(iBST);
                            cs["vl"][vertexCheckBfClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["vl"][vertexCheckBfLeftClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["el"][vertexCheckBfClass]["state"] = EDGE_HIGHLIGHTED;
                            if (iBST["root"] != vertexCheckBfLeft)
                                cs["el"][vertexCheckBfLeftClass]["state"] = EDGE_HIGHLIGHTED;
                            cs["status"] = 'Tăng tốc độ tìm kiếm cho cây';
                            cs["lineNo"] = 3;
                            sl.push(cs);
                        }
                        else if (bfLeft == -1) {
                            var vertexCheckBfLeftRight = iBST[vertexCheckBfLeft]["rightChild"];
                            var vertexCheckBfLeftRightClass = iBST[vertexCheckBfLeftRight]["vertexClassNumber"];

                            rotateLeft(vertexCheckBfLeft);

                            cs = createState(iBST);
                            cs["vl"][vertexCheckBfLeftClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["vl"][vertexCheckBfLeftRightClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["el"][vertexCheckBfLeftClass]["state"] = EDGE_HIGHLIGHTED;
                            cs["el"][vertexCheckBfLeftRightClass]["state"] = EDGE_HIGHLIGHTED;
                            cs["status"] = 'Xoay trái {vertexCheckBf}.'.replace("{vertexCheckBf}", vertexCheckBfLeft);
                            cs["lineNo"] = 4;
                            sl.push(cs);

                            recalculatePosition();

                            cs = createState(iBST);
                            cs["vl"][vertexCheckBfLeftClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["vl"][vertexCheckBfLeftRightClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["el"][vertexCheckBfLeftClass]["state"] = EDGE_HIGHLIGHTED;
                            cs["el"][vertexCheckBfLeftRightClass]["state"] = EDGE_HIGHLIGHTED;
                            cs["status"] = 'Tăng tốc độ tìm kiếm cho cây!';
                            cs["lineNo"] = 4;
                            sl.push(cs);

                            rotateRight(vertexCheckBf);

                            cs = createState(iBST);
                            cs["vl"][vertexCheckBfClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["vl"][vertexCheckBfLeftRightClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["el"][vertexCheckBfClass]["state"] = EDGE_HIGHLIGHTED;
                            if (iBST["root"] != vertexCheckBfLeftRight)
                                cs["el"][vertexCheckBfLeftRightClass]["state"] = EDGE_HIGHLIGHTED;
                            cs["status"] = 'Xoay phải {vertexCheckBf}.'.replace("{vertexCheckBf}", vertexCheckBf);
                            cs["lineNo"] = 4;
                            sl.push(cs);

                            recalculatePosition();

                            cs = createState(iBST);
                            cs["vl"][vertexCheckBfClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["vl"][vertexCheckBfLeftRightClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["el"][vertexCheckBfClass]["state"] = EDGE_HIGHLIGHTED;
                            if (iBST["root"] != vertexCheckBfLeftRight)
                                cs["el"][vertexCheckBfLeftRightClass]["state"] = EDGE_HIGHLIGHTED;
                            cs["status"] = 'Tăng tốc độ tìm kiếm cho cây!';
                            cs["lineNo"] = 4;
                            sl.push(cs);
                        }
                    }
                    else if (bf == -2) {
                        var vertexCheckBfRight = iBST[vertexCheckBf]["rightChild"];
                        var vertexCheckBfRightClass = iBST[vertexCheckBfRight]["vertexClassNumber"];
                        var bfRight = iBST[vertexCheckBfRight]["balanceFactor"];

                        cs = createState(iBST);
                        cs["vl"][vertexCheckBfClass]["state"] = VERTEX_HIGHLIGHTED;
                        cs["vl"][vertexCheckBfRightClass]["state"] = VERTEX_HIGHLIGHTED;
                        cs["status"] = 'Và hệ số cân bằng của {vertexCheckBf} is {bf}.'.replace("{vertexCheckBf}", vertexCheckBfRight).replace("{bf}", bfRight);
                        cs["lineNo"] = 2;
                        sl.push(cs);

                        if (bfRight == 1) {
                            var vertexCheckBfRightLeft = iBST[vertexCheckBfRight]["leftChild"];
                            var vertexCheckBfRightLeftClass = iBST[vertexCheckBfRightLeft]["vertexClassNumber"];

                            rotateRight(vertexCheckBfRight);

                            cs = createState(iBST);
                            cs["vl"][vertexCheckBfRightClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["vl"][vertexCheckBfRightLeftClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["el"][vertexCheckBfRightClass]["state"] = EDGE_HIGHLIGHTED;
                            cs["el"][vertexCheckBfRightLeftClass]["state"] = EDGE_HIGHLIGHTED;
                            cs["status"] = 'Xoay phải {vertexCheckBf}.'.replace("{vertexCheckBf}", vertexCheckBfRight);
                            cs["lineNo"] = 6;
                            sl.push(cs);

                            recalculatePosition();

                            cs = createState(iBST);
                            cs["vl"][vertexCheckBfRightClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["vl"][vertexCheckBfRightLeftClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["el"][vertexCheckBfRightClass]["state"] = EDGE_HIGHLIGHTED;
                            cs["el"][vertexCheckBfRightLeftClass]["state"] = EDGE_HIGHLIGHTED;
                            cs["status"] = 'Tăng tốc độ tìm kiếm cho cây!';
                            cs["lineNo"] = 6;
                            sl.push(cs);

                            rotateLeft(vertexCheckBf);

                            cs = createState(iBST);
                            cs["vl"][vertexCheckBfClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["vl"][vertexCheckBfRightLeftClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["el"][vertexCheckBfClass]["state"] = EDGE_HIGHLIGHTED;
                            if (iBST["root"] != vertexCheckBfRightLeft)
                                cs["el"][vertexCheckBfRightLeftClass]["state"] = EDGE_HIGHLIGHTED;
                            cs["status"] = 'Xoay trái {vertexCheckBf}.'.replace("{vertexCheckBf}", vertexCheckBf);
                            cs["lineNo"] = 6;
                            sl.push(cs);

                            recalculatePosition();

                            cs = createState(iBST);
                            cs["vl"][vertexCheckBfClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["vl"][vertexCheckBfRightLeftClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["el"][vertexCheckBfClass]["state"] = EDGE_HIGHLIGHTED;
                            if (iBST["root"] != vertexCheckBfRightLeft)
                                cs["el"][vertexCheckBfRightLeftClass]["state"] = EDGE_HIGHLIGHTED;
                            cs["status"] = 'Tăng tốc độ tìm kiếm cho cây!';
                            cs["lineNo"] = 6;
                            sl.push(cs);
                        }
                        else if (bfRight == -1 || bfRight == 0) {
                            rotateLeft(vertexCheckBf);

                            cs = createState(iBST);
                            cs["vl"][vertexCheckBfClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["vl"][vertexCheckBfRightClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["el"][vertexCheckBfClass]["state"] = EDGE_HIGHLIGHTED;
                            if (iBST["root"] != vertexCheckBfRight)
                                cs["el"][vertexCheckBfRightClass]["state"] = EDGE_HIGHLIGHTED;
                            cs["status"] = 'Xoay trái {vertexCheckBf}.'.replace("{vertexCheckBf}", vertexCheckBf);
                            cs["lineNo"] = 5;
                            sl.push(cs);

                            recalculatePosition();

                            cs = createState(iBST);

                            cs["vl"][vertexCheckBfClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["vl"][vertexCheckBfRightClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["el"][vertexCheckBfClass]["state"] = EDGE_HIGHLIGHTED;
                            if (iBST["root"] != vertexCheckBfRight)
                                cs["el"][vertexCheckBfRightClass]["state"] = EDGE_HIGHLIGHTED;
                            cs["status"] = 'Tăng tốc độ tìm kiếm cho cây!';
                            cs["lineNo"] = 5;
                            sl.push(cs);
                        }
                    }

                    if (vertexCheckBf != iBST["root"]) {
                        cs = createState(iBST);
                        cs["el"][vertexCheckBfClass]["state"] = EDGE_HIGHLIGHTED;
                        cs["status"] = 'Check the parent vertex.';
                        cs["lineNo"] = 2;
                        sl.push(cs);
                    }

                    vertexCheckBf = iBST[vertexCheckBf]["parent"];
                }

                cs = createState(iBST);
                cs["status"] = 'The tree is now balanced.';
                cs["lineNo"] = 7;
                sl.push(cs);
            }
        }

        gw.startAnimation(sl, callback);
        if (isAVL) populatePseudocode(6);
        else populatePseudocode(0);
        return true;
    }

    this.removeArr = function (vertexTextArr, callback) {
        var sl = [];
        var vertexTraversed = {};
        var edgeTraversed = {};
        var cur = iBST["root"];
        var cs = createState(iBST);
        var currentVertexClass;
        var key;
        var i;

        cs["status"] = 'Cây BST hiện tại';
        cs["lineNo"] = 0;
        sl.push(cs);

        if (Object.prototype.toString.call(vertexTextArr) != '[object Array]') {
            $('#remove-err').html('Hãy điền vào một số hoặc mảng số được phân tách bằng dấu phẩy!');
            return false;
        }

        // Loop through all array values and...
        for (i = 0; i < vertexTextArr.length; i++) {
            var vt = parseInt(vertexTextArr[i]);

            // Check whether value is number
            if (isNaN(vt)) {
                $('#remove-err').html('Hãy điền vào một số hoặc mảng số được phân tách bằng dấu phẩy!');
                return false;
            }
            // Other checks not required
        }

        for (i = 0; i < vertexTextArr.length; i++) {
            var val = parseInt(vertexTextArr[i]);
            var vertexCheckBf;
            // Re-initialization
            vertexTraversed = {};
            edgeTraversed = {};
            cur = iBST["root"];
            cs = createState(iBST);
            // Find vertex
            while (cur != val && cur != null) {
                cs = createState(iBST, vertexTraversed, edgeTraversed);
                currentVertexClass = iBST[cur]["vertexClassNumber"];

                cs["vl"][currentVertexClass]["state"] = VERTEX_HIGHLIGHTED;

                vertexTraversed[cur] = true;

                cs["status"] = 'Đang tìm kiếm node có giá trị =  {val} để xóa.'.replace("{val}", val);
                cs["lineNo"] = 1;
                sl.push(cs);

                if (parseInt(val) > parseInt(cur))
                    cur = iBST[cur]["rightChild"];
                else
                    cur = iBST[cur]["leftChild"];

                if (cur == null) break;

                cs = createState(iBST, vertexTraversed, edgeTraversed);

                var edgeHighlighted = iBST[cur]["vertexClassNumber"];
                edgeTraversed[edgeHighlighted] = true;

                cs["el"][edgeHighlighted]["animateHighlighted"] = true;
                cs["el"][edgeHighlighted]["state"] = EDGE_TRAVERSED;

                cs["status"] = 'Đang tìm kiếm node có giá trị =  {val} để xóa.'.replace("{val}", val);
                cs["lineNo"] = 1;
                sl.push(cs);
            }

            if (cur != null) {
                cs = createState(iBST, vertexTraversed, edgeTraversed);
                currentVertexClass = iBST[cur]["vertexClassNumber"];

                cs["vl"][currentVertexClass]["state"] = VERTEX_HIGHLIGHTED;

                cs["status"] = 'Đang tìm kiếm node có giá trị =  {val} để xóa.'.replace("{val}", val);
                cs["lineNo"] = 1;
                sl.push(cs);
            }
            // Vertex is not inside the tree
            else {
                cs = createState(iBST);
                cs["status"] = 'Node có giá trị = {val} không có trong BST'.replace("{val}", val);
                cs["lineNo"] = 0; //Node {val} không có trong BST
                sl.push(cs);
                continue;
            }

            // Vertex found; begin deletion
            // Case 1: no child
            if (iBST[cur]["leftChild"] == null && iBST[cur]["rightChild"] == null) {
                cs = createState(iBST, vertexTraversed, edgeTraversed);
                cs["status"] = 'Node có giá trị = {val} không còn node con. Nó chính là node lá.'.replace("{val}", val);
                if (!isAVL) cs["lineNo"] = 2;
                else cs["lineNo"] = 1;
                sl.push(cs);

                var parentVertex = iBST[cur]["parent"];

                if (parentVertex != null) {
                    if (parseInt(parentVertex) < parseInt(cur))
                        iBST[parentVertex]["rightChild"] = null;
                    else
                        iBST[parentVertex]["leftChild"] = null;
                }
                else
                    iBST["root"] = null;

                currentVertexClass = iBST[cur]["vertexClassNumber"];
                delete iBST[cur];
                delete vertexTraversed[cur];
                delete edgeTraversed[currentVertexClass];

                cs = createState(iBST, vertexTraversed, edgeTraversed);

                cs["status"] = 'Xóa node lá {val}'.replace("{val}", val);
                if (!isAVL) cs["lineNo"] = 3;
                else cs["lineNo"] = 1;
                sl.push(cs);

                vertexCheckBf = parentVertex;
            }
            // Case 2: One child
            else if (iBST[cur]["leftChild"] == null) { // Only right child
                cs = createState(iBST, vertexTraversed, edgeTraversed);
                cs["status"] = 'Node có giá trị {val} chỉ có node con bên phải'.replace("{val}", val);
                if (!isAVL) cs["lineNo"] = 4;
                else cs["lineNo"] = 1;
                sl.push(cs);

                var parentVertex = iBST[cur]["parent"];
                var rightChildVertex = iBST[cur]["rightChild"];

                if (parentVertex != null) {
                    if (parseInt(parentVertex) < parseInt(cur))
                        iBST[parentVertex]["rightChild"] = rightChildVertex;
                    else
                        iBST[parentVertex]["leftChild"] = rightChildVertex;
                }
                else
                    iBST["root"] = rightChildVertex;

                iBST[rightChildVertex]["parent"] = parentVertex;

                currentVertexClass = iBST[cur]["vertexClassNumber"];
                rightChildVertexClass = iBST[rightChildVertex]["vertexClassNumber"];
                delete iBST[cur];
                delete vertexTraversed[cur];
                delete edgeTraversed[currentVertexClass];

                cs = createState(iBST, vertexTraversed, edgeTraversed);

                cs["vl"][rightChildVertexClass]["state"] = VERTEX_HIGHLIGHTED;

                if (parentVertex != null)
                    cs["el"][rightChildVertexClass]["state"] = EDGE_HIGHLIGHTED;

                cs["status"] = 'Xóa node có giá trị {val} và nối node cha của nó với node con bên phải nó.'.replace("{val}", val);
                if (!isAVL) cs["lineNo"] = 5;
                else cs["lineNo"] = 1;
                sl.push(cs);

                recalculatePosition();

                cs = createState(iBST, vertexTraversed, edgeTraversed);

                cs["vl"][rightChildVertexClass]["state"] = VERTEX_HIGHLIGHTED;

                if (parentVertex != null)
                    cs["el"][rightChildVertexClass]["state"] = EDGE_HIGHLIGHTED;

                cs["status"] = 'Bố trí lại cây';
                if (!isAVL) cs["lineNo"] = 5;
                else cs["lineNo"] = 1;
                sl.push(cs);

                vertexCheckBf = rightChildVertex;
            }
            else if (iBST[cur]["rightChild"] == null) { // Only left child
                cs = createState(iBST, vertexTraversed, edgeTraversed);
                cs["status"] = 'Node có giá trị {val} chỉ có node con bên trái.'.replace("{val}", val);
                if (!isAVL) cs["lineNo"] = 4;
                else cs["lineNo"] = 1;
                sl.push(cs);

                var parentVertex = iBST[cur]["parent"];
                var leftChildVertex = iBST[cur]["leftChild"];

                if (parentVertex != null) {
                    if (parseInt(parentVertex) < parseInt(cur))
                        iBST[parentVertex]["rightChild"] = leftChildVertex;
                    else
                        iBST[parentVertex]["leftChild"] = leftChildVertex;
                }
                else
                    iBST["root"] = leftChildVertex;

                iBST[leftChildVertex]["parent"] = parentVertex;

                currentVertexClass = iBST[cur]["vertexClassNumber"];
                leftChildVertexClass = iBST[leftChildVertex]["vertexClassNumber"];
                delete iBST[cur];
                delete vertexTraversed[cur];
                delete edgeTraversed[currentVertexClass];

                cs = createState(iBST, vertexTraversed, edgeTraversed);

                cs["vl"][leftChildVertexClass]["state"] = VERTEX_HIGHLIGHTED;

                if (parentVertex != null)
                    cs["el"][leftChildVertexClass]["state"] = EDGE_HIGHLIGHTED;

                cs["status"] = 'Xóa node có giá trị {val} và nối node cha của nó với node con bên trái nó '.replace("{val}", val);
                if (!isAVL) cs["lineNo"] = 5;
                else cs["lineNo"] = 1;
                sl.push(cs);

                recalculatePosition();

                cs = createState(iBST, vertexTraversed, edgeTraversed);

                cs["vl"][leftChildVertexClass]["state"] = VERTEX_HIGHLIGHTED;

                if (parentVertex != null)
                    cs["el"][leftChildVertexClass]["state"] = EDGE_HIGHLIGHTED;

                cs["status"] = 'Bố trí lại cây';
                if (!isAVL) cs["lineNo"] = 5;
                else cs["lineNo"] = 1;
                sl.push(cs);

                vertexCheckBf = leftChildVertex;
            }
            else { // Case 3: two children
                var parentVertex = iBST[cur]["parent"];
                var leftChildVertex = iBST[cur]["leftChild"];
                var rightChildVertex = iBST[cur]["rightChild"];
                var successorVertex = iBST[cur]["rightChild"];
                var successorVertexClass = iBST[successorVertex]["vertexClassNumber"];

                cs = createState(iBST, vertexTraversed, edgeTraversed);

                cs["vl"][currentVertexClass]["state"] = VERTEX_HIGHLIGHTED;

                cs["el"][successorVertexClass]["state"] = EDGE_TRAVERSED;
                cs["el"][successorVertexClass]["animateHighlighted"] = true;

                cs["status"] = 'Đang tìm kiếm node thừa kế node {val}...'.replace("{val}", val);
                if (!isAVL) cs["lineNo"] = 6;
                else cs["lineNo"] = 1;
                sl.push(cs);

                edgeTraversed[successorVertexClass] = true;
                vertexTraversed[successorVertex] = true;

                cs = createState(iBST, vertexTraversed, edgeTraversed);
                cs["vl"][currentVertexClass]["state"] = VERTEX_HIGHLIGHTED;
                cs["vl"][successorVertexClass]["state"] = VERTEX_HIGHLIGHTED;
                cs["status"] = 'Đang tìm kiếm node thừa kế node {val}...'.replace("{val}", val);
                if (!isAVL) cs["lineNo"] = 6;
                else cs["lineNo"] = 1;
                sl.push(cs);

                while (iBST[successorVertex]["leftChild"] != null) {
                    successorVertex = iBST[successorVertex]["leftChild"];
                    successorVertexClass = iBST[successorVertex]["vertexClassNumber"];

                    cs = createState(iBST, vertexTraversed, edgeTraversed);
                    cs["vl"][currentVertexClass]["state"] = VERTEX_HIGHLIGHTED;
                    cs["el"][successorVertexClass]["state"] = EDGE_TRAVERSED;
                    cs["el"][successorVertexClass]["animateHighlighted"] = true;
                    cs["status"] = 'Đang tìm kiếm node thừa kế node {val}...'.replace("{val}", val);
                    if (!isAVL) cs["lineNo"] = 6;
                    else cs["lineNo"] = 1;
                    sl.push(cs);

                    edgeTraversed[successorVertexClass] = true;
                    vertexTraversed[successorVertex] = true;

                    cs = createState(iBST, vertexTraversed, edgeTraversed);

                    cs["vl"][currentVertexClass]["state"] = VERTEX_HIGHLIGHTED;
                    cs["vl"][successorVertexClass]["state"] = VERTEX_HIGHLIGHTED;
                    cs["status"] = 'Đang tìm kiếm node thừa kế node {val}...'.replace("{val}", val);
                    if (!isAVL) cs["lineNo"] = 6;
                    else cs["lineNo"] = 1;
                    sl.push(cs);
                }

                var successorParentVertex = iBST[successorVertex]["parent"]
                var successorRightChildVertex = iBST[successorVertex]["rightChild"];

                // Update internal representation
                if (parentVertex != null) {
                    if (parseInt(parentVertex) < parseInt(cur))
                        iBST[parentVertex]["rightChild"] = successorVertex;
                    else
                        iBST[parentVertex]["leftChild"] = successorVertex;
                }
                else
                    iBST["root"] = successorVertex;

                iBST[successorVertex]["parent"] = parentVertex;
                iBST[successorVertex]["leftChild"] = leftChildVertex;
                iBST[leftChildVertex]["parent"] = successorVertex;
                if (successorVertex != rightChildVertex) {
                    iBST[successorVertex]["rightChild"] = rightChildVertex;
                    iBST[rightChildVertex]["parent"] = successorVertex;

                    if (successorRightChildVertex != null) {
                        if (parseInt(successorParentVertex) < parseInt(successorVertex))
                            iBST[successorParentVertex]["rightChild"] = successorRightChildVertex;
                        else
                            iBST[successorParentVertex]["leftChild"] = successorRightChildVertex;
                        iBST[successorRightChildVertex]["parent"] = successorParentVertex;
                    }
                    else {
                        if (parseInt(successorParentVertex) < parseInt(successorVertex))
                            iBST[successorParentVertex]["rightChild"] = null;
                        else
                            iBST[successorParentVertex]["leftChild"] = null;
                    }
                }

                delete iBST[cur];
                delete vertexTraversed[cur];
                delete edgeTraversed[currentVertexClass];

                if (parentVertex == null)
                    delete edgeTraversed[successorVertexClass];

                cs = createState(iBST, vertexTraversed, edgeTraversed);

                var leftChildVertexClass = iBST[leftChildVertex]["vertexClassNumber"];

                cs["vl"][successorVertexClass]["state"] = VERTEX_HIGHLIGHTED;
                cs["el"][leftChildVertexClass]["state"] = EDGE_HIGHLIGHTED;

                if (parentVertex != null) {
                    var parentVertexClass = iBST[parentVertex]["vertexClassNumber"];
                    cs["el"][successorVertexClass]["state"] = EDGE_HIGHLIGHTED;
                }

                if (successorVertex != rightChildVertex) {
                    var rightChildVertexClass = iBST[rightChildVertex]["vertexClassNumber"];
                    cs["el"][rightChildVertexClass]["state"] = EDGE_HIGHLIGHTED;
                    if (successorRightChildVertex != null) {
                        var successorRightChildVertexClass = iBST[successorRightChildVertex]["vertexClassNumber"];
                        cs["el"][successorRightChildVertexClass]["state"] = EDGE_HIGHLIGHTED;
                    }
                }

                cs["status"] = 'Đổi vị trí node {val} với node thừa kế nó.'.replace("{val}", val);
                if (!isAVL) cs["lineNo"] = 6;
                else cs["lineNo"] = 1;
                sl.push(cs);

                recalculatePosition();

                cs = createState(iBST, vertexTraversed, edgeTraversed);

                leftChildVertexClass = iBST[leftChildVertex]["vertexClassNumber"];

                cs["vl"][successorVertexClass]["state"] = VERTEX_HIGHLIGHTED;
                cs["el"][leftChildVertexClass]["state"] = EDGE_HIGHLIGHTED;

                if (parentVertex != null) {
                    var parentVertexClass = iBST[parentVertex]["vertexClassNumber"];
                    cs["el"][successorVertexClass]["state"] = EDGE_HIGHLIGHTED;
                }

                if (successorVertex != rightChildVertex) {
                    var rightChildVertexClass = iBST[rightChildVertex]["vertexClassNumber"];
                    cs["el"][rightChildVertexClass]["state"] = EDGE_HIGHLIGHTED;

                    if (successorRightChildVertex != null) {
                        var successorRightChildVertexClass = iBST[successorRightChildVertex]["vertexClassNumber"];
                        cs["el"][successorRightChildVertexClass]["state"] = EDGE_HIGHLIGHTED;
                    }
                }

                cs["status"] = 'Bố trí lại cây';
                if (!isAVL) cs["lineNo"] = 6;
                else cs["lineNo"] = 1;
                sl.push(cs);

                vertexCheckBf = successorVertex;
                if (successorVertex != rightChildVertex)
                    vertexCheckBf = successorParentVertex;
            }

            cs = createState(iBST);
            cs["status"] = 'Thực hiện xóa node có giá trị = {val} thành công.'.replace("{val}", val);
            if (!isAVL) cs["lineNo"] = 0;
            else cs["lineNo"] = 1;
            sl.push(cs);

            if (isAVL) {
                recalculateBalanceFactor();
                while (vertexCheckBf != null) {
                    var vertexCheckBfClass = iBST[vertexCheckBf]["vertexClassNumber"];

                    var bf = iBST[vertexCheckBf]["balanceFactor"];

                    cs = createState(iBST);
                    cs["vl"][vertexCheckBfClass]["state"] = VERTEX_HIGHLIGHTED;
                    cs["status"] = 'Hệ số cân bằng của {vertexCheckBf} là {bf}.'.replace("{vertexCheckBf}", vertexCheckBf).replace("{bf}", bf);
                    cs["lineNo"] = 2;
                    sl.push(cs);

                    if (bf == 2) {
                        var vertexCheckBfLeft = iBST[vertexCheckBf]["leftChild"];
                        var vertexCheckBfLeftClass = iBST[vertexCheckBfLeft]["vertexClassNumber"];
                        var bfLeft = iBST[vertexCheckBfLeft]["balanceFactor"];

                        cs = createState(iBST);
                        cs["vl"][vertexCheckBfClass]["state"] = VERTEX_HIGHLIGHTED;
                        cs["vl"][vertexCheckBfLeftClass]["state"] = VERTEX_HIGHLIGHTED;
                        cs["status"] = 'Và hệ số cân bằng của {vertexCheckBf} là {bf}.'.replace("{vertexCheckBfLeft}", vertexCheckBf).replace("{bfLeft}", bf);
                        cs["lineNo"] = 2;
                        sl.push(cs);

                        if (bfLeft == 1 || bfLeft == 0) {
                            rotateRight(vertexCheckBf);

                            cs = createState(iBST);
                            cs["vl"][vertexCheckBfClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["vl"][vertexCheckBfLeftClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["el"][vertexCheckBfClass]["state"] = EDGE_HIGHLIGHTED;
                            if (iBST["root"] != vertexCheckBfLeft)
                                cs["el"][vertexCheckBfLeftClass]["state"] = EDGE_HIGHLIGHTED;
                            cs["status"] = 'Xoay phải {vertexCheckBf}.'.replace("{vertexCheckBf}", vertexCheckBf);
                            cs["lineNo"] = 3;
                            sl.push(cs);

                            recalculatePosition();

                            cs = createState(iBST);
                            cs["vl"][vertexCheckBfClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["vl"][vertexCheckBfLeftClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["el"][vertexCheckBfClass]["state"] = EDGE_HIGHLIGHTED;
                            if (iBST["root"] != vertexCheckBfLeft)
                                cs["el"][vertexCheckBfLeftClass]["state"] = EDGE_HIGHLIGHTED;
                            cs["status"] = 'Bố trí lại cây';
                            cs["lineNo"] = 3;
                            sl.push(cs);
                        }
                        else if (bfLeft == -1) {
                            var vertexCheckBfLeftRight = iBST[vertexCheckBfLeft]["rightChild"];
                            var vertexCheckBfLeftRightClass = iBST[vertexCheckBfLeftRight]["vertexClassNumber"];

                            rotateLeft(vertexCheckBfLeft);

                            cs = createState(iBST);
                            cs["vl"][vertexCheckBfLeftClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["vl"][vertexCheckBfLeftRightClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["el"][vertexCheckBfLeftClass]["state"] = EDGE_HIGHLIGHTED;
                            cs["el"][vertexCheckBfLeftRightClass]["state"] = EDGE_HIGHLIGHTED;
                            cs["status"] = 'Xoay trái {vertexCheckBf}.'.replace("{vertexCheckBf}", vertexCheckBfLeft);
                            cs["lineNo"] = 4;
                            sl.push(cs);

                            recalculatePosition();

                            cs = createState(iBST);
                            cs["vl"][vertexCheckBfLeftClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["vl"][vertexCheckBfLeftRightClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["el"][vertexCheckBfLeftClass]["state"] = EDGE_HIGHLIGHTED;
                            cs["el"][vertexCheckBfLeftRightClass]["state"] = EDGE_HIGHLIGHTED;
                            cs["status"] = 'Bố trí lại cây';
                            cs["lineNo"] = 4;
                            sl.push(cs);

                            rotateRight(vertexCheckBf);

                            cs = createState(iBST);
                            cs["vl"][vertexCheckBfClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["vl"][vertexCheckBfLeftRightClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["el"][vertexCheckBfClass]["state"] = EDGE_HIGHLIGHTED;
                            if (iBST["root"] != vertexCheckBfLeftRight)
                                cs["el"][vertexCheckBfLeftRightClass]["state"] = EDGE_HIGHLIGHTED;
                            cs["status"] = 'Xoay phải {vertexCheckBf}.'.replace("{vertexCheckBf}", vertexCheckBf);
                            cs["lineNo"] = 4;
                            sl.push(cs);

                            recalculatePosition();

                            cs = createState(iBST);
                            cs["vl"][vertexCheckBfClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["vl"][vertexCheckBfLeftRightClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["el"][vertexCheckBfClass]["state"] = EDGE_HIGHLIGHTED;
                            if (iBST["root"] != vertexCheckBfLeftRight)
                                cs["el"][vertexCheckBfLeftRightClass]["state"] = EDGE_HIGHLIGHTED;
                            cs["status"] = 'Bố trí lại cây';
                            cs["lineNo"] = 4;
                            sl.push(cs);
                        }
                    }
                    else if (bf == -2) {
                        var vertexCheckBfRight = iBST[vertexCheckBf]["rightChild"];
                        var vertexCheckBfRightClass = iBST[vertexCheckBfRight]["vertexClassNumber"];
                        var bfRight = iBST[vertexCheckBfRight]["balanceFactor"];

                        cs = createState(iBST);
                        cs["vl"][vertexCheckBfClass]["state"] = VERTEX_HIGHLIGHTED;
                        cs["vl"][vertexCheckBfRightClass]["state"] = VERTEX_HIGHLIGHTED;
                        cs["status"] = 'Và hệ số cân bằng của {vertexCheckBf} is {bf}.'.replace("{vertexCheckBf}", vertexCheckBfRight).replace("{bf}", bfRight);
                        cs["lineNo"] = 2;
                        sl.push(cs);

                        if (bfRight == 1) {
                            var vertexCheckBfRightLeft = iBST[vertexCheckBfRight]["leftChild"];
                            var vertexCheckBfRightLeftClass = iBST[vertexCheckBfRightLeft]["vertexClassNumber"];

                            rotateRight(vertexCheckBfRight);

                            cs = createState(iBST);
                            cs["vl"][vertexCheckBfRightClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["vl"][vertexCheckBfRightLeftClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["el"][vertexCheckBfRightClass]["state"] = EDGE_HIGHLIGHTED;
                            cs["el"][vertexCheckBfRightLeftClass]["state"] = EDGE_HIGHLIGHTED;
                            cs["status"] = 'Xoay phải {vertexCheckBf}.'.replace("{vertexCheckBf}", vertexCheckBfRight);
                            cs["lineNo"] = 6;
                            sl.push(cs);

                            recalculatePosition();

                            cs = createState(iBST);
                            cs["vl"][vertexCheckBfRightClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["vl"][vertexCheckBfRightLeftClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["el"][vertexCheckBfRightClass]["state"] = EDGE_HIGHLIGHTED;
                            cs["el"][vertexCheckBfRightLeftClass]["state"] = EDGE_HIGHLIGHTED;
                            cs["status"] = 'Bố trí lại cây';
                            cs["lineNo"] = 6;
                            sl.push(cs);

                            rotateLeft(vertexCheckBf);

                            cs = createState(iBST);
                            cs["vl"][vertexCheckBfClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["vl"][vertexCheckBfRightLeftClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["el"][vertexCheckBfClass]["state"] = EDGE_HIGHLIGHTED;
                            if (iBST["root"] != vertexCheckBfRightLeft)
                                cs["el"][vertexCheckBfRightLeftClass]["state"] = EDGE_HIGHLIGHTED;
                            cs["status"] = 'Xoay trái {vertexCheckBf}.'.replace("{vertexCheckBf}", vertexCheckBf);
                            cs["lineNo"] = 6;
                            sl.push(cs);

                            recalculatePosition();

                            cs = createState(iBST);
                            cs["vl"][vertexCheckBfClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["vl"][vertexCheckBfRightLeftClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["el"][vertexCheckBfClass]["state"] = EDGE_HIGHLIGHTED;
                            if (iBST["root"] != vertexCheckBfRightLeft)
                                cs["el"][vertexCheckBfRightLeftClass]["state"] = EDGE_HIGHLIGHTED;
                            cs["status"] = 'Bố trí lại cây';
                            cs["lineNo"] = 6;
                            sl.push(cs);
                        }
                        else if (bfRight == -1 || bfRight == 0) {
                            rotateLeft(vertexCheckBf);

                            cs = createState(iBST);
                            cs["vl"][vertexCheckBfClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["vl"][vertexCheckBfRightClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["el"][vertexCheckBfClass]["state"] = EDGE_HIGHLIGHTED;
                            if (iBST["root"] != vertexCheckBfRight)
                                cs["el"][vertexCheckBfRightClass]["state"] = EDGE_HIGHLIGHTED;
                            cs["status"] = 'Xoay trái {vertexCheckBf}.'.replace("{vertexCheckBf}", vertexCheckBf);
                            cs["lineNo"] = 5;
                            sl.push(cs);

                            recalculatePosition();

                            cs = createState(iBST);

                            cs["vl"][vertexCheckBfClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["vl"][vertexCheckBfRightClass]["state"] = VERTEX_HIGHLIGHTED;
                            cs["el"][vertexCheckBfClass]["state"] = EDGE_HIGHLIGHTED;
                            if (iBST["root"] != vertexCheckBfRight)
                                cs["el"][vertexCheckBfRightClass]["state"] = EDGE_HIGHLIGHTED;
                            cs["status"] = 'Bố trí lại cây';
                            cs["lineNo"] = 5;
                            sl.push(cs);
                        }
                    }

                    if (vertexCheckBf != iBST["root"]) {
                        cs = createState(iBST);
                        cs["el"][vertexCheckBfClass]["state"] = EDGE_HIGHLIGHTED;
                        cs["status"] = 'Kiểm tra đỉnh cha ...';
                        cs["lineNo"] = 2;
                        sl.push(cs);
                    }
                    vertexCheckBf = iBST[vertexCheckBf]["parent"];
                }

                cs = createState(iBST);
                cs["status"] = 'Hiện cây đã cân đối.';
                cs["lineNo"] = 7;
                sl.push(cs);
            }
        }

        gw.startAnimation(sl, callback);
        if (isAVL) populatePseudocode(7);
        else populatePseudocode(5);
        return true;
    };

    function init(initArr) {
        var i;

        clearScreen();

        for (i = 0; i < initArr.length; i++) {
            var parentVertex = iBST["root"];
            var newVertex = parseInt(initArr[i]);

            if (parentVertex == null) {
                iBST["root"] = parseInt(newVertex);
                iBST[newVertex] = {
                    "parent": null,
                    "leftChild": null,
                    "rightChild": null,
                    "vertexClassNumber": amountVertex
                };
            }
            else {
                while (true) {
                    if (parentVertex < newVertex) {
                        if (iBST[parentVertex]["rightChild"] == null) break;
                        parentVertex = iBST[parentVertex]["rightChild"];
                    }
                    else {
                        if (iBST[parentVertex]["leftChild"] == null) break;
                        parentVertex = iBST[parentVertex]["leftChild"];
                    }
                }

                if (parentVertex < newVertex)
                    iBST[parentVertex]["rightChild"] = newVertex;
                else
                    iBST[parentVertex]["leftChild"] = newVertex;

                iBST[newVertex] = {
                    "parent": parentVertex,
                    "leftChild": null,
                    "rightChild": null,
                    "vertexClassNumber": amountVertex
                }
            }

            amountVertex++;
        }

        recalculatePosition();

        for (key in iBST) {
            if (key == "root") continue;
            gw.addVertex(iBST[key]["cx"], iBST[key]["cy"], key, iBST[key]["vertexClassNumber"], true);
        }

        for (key in iBST) {
            if (key == "root") continue;
            if (key == iBST["root"]) continue;
            var parentVertex = iBST[key]["parent"];
            gw.addEdge(iBST[parentVertex]["vertexClassNumber"], iBST[key]["vertexClassNumber"], iBST[key]["vertexClassNumber"], EDGE_TYPE_UDE, 1, true);
        }
    }

    function clearScreen() {
        var key;

        for (key in iBST) {
            if (key == "root") continue;
            gw.removeEdge(iBST[key]["vertexClassNumber"]);
        }

        for (key in iBST) {
            if (key == "root") continue;
            gw.removeVertex(iBST[key]["vertexClassNumber"]);
        }

        iBST = {};
        iBST["root"] = null;
        amountVertex = 0;
    }

    // Pseudocode for rotateLeft:
    /*
     * BSTVertex rotateLeft(BSTVertex T) // pre-req: T.right != null
     * BSTVertex w = T.right
     * w.parent = T.parent
     * T.parent = w
     * T.right = w.left
     * if (w.left != null) w.left.parent = T
     * w.left = T
     * // Update the height of T and then w
     * return w
     */

    function rotateLeft(val) {
        // Refer to pseudocode

        var t = parseInt(val);
        var w = iBST[t]["rightChild"];

        iBST[w]["parent"] = iBST[t]["parent"];
        if (iBST[t]["parent"] != null) {
            if (iBST[t]["parent"] < t) {
                var tParent = iBST[t]["parent"];
                iBST[tParent]["rightChild"] = w;
            }
            else {
                var tParent = iBST[t]["parent"];
                iBST[tParent]["leftChild"] = w;
            }
        }

        iBST[t]["parent"] = w;
        iBST[t]["rightChild"] = iBST[w]["leftChild"];
        if (iBST[w]["leftChild"] != null)
            iBST[iBST[w]["leftChild"]]["parent"] = t;
        iBST[w]["leftChild"] = t;

        if (t == iBST["root"])
            iBST["root"] = w;

        recalculateBalanceFactor();
    }

    function rotateRight(val) {
        // Refer to pseudocode

        var t = parseInt(val);
        var w = iBST[t]["leftChild"];

        iBST[w]["parent"] = iBST[t]["parent"];
        if (iBST[t]["parent"] != null) {
            if (iBST[t]["parent"] < t) {
                var tParent = iBST[t]["parent"];
                iBST[tParent]["rightChild"] = w;
            }
            else {
                var tParent = iBST[t]["parent"];
                iBST[tParent]["leftChild"] = w;
            }
        }

        iBST[t]["parent"] = w;
        iBST[t]["leftChild"] = iBST[w]["rightChild"];
        if (iBST[w]["rightChild"] != null)
            iBST[iBST[w]["rightChild"]]["parent"] = t;
        iBST[w]["rightChild"] = t;

        if (t == iBST["root"])
            iBST["root"] = w;

        recalculateBalanceFactor();
    }

    /*
     * iBSTObject: a JS object with the same structure of iBST. This means the BST doen't have to be the BST stored in this class
     * vertexTraversed: JS object with the vertexes of the BST which are to be marked as traversed as the key
     * edgeTraversed: JS object with the edges of the BST which are to be marked as traversed as the key
     */

    function createState(iBSTObject, vertexTraversed, edgeTraversed) {
        if (vertexTraversed == null || vertexTraversed == undefined || !(vertexTraversed instanceof Object))
            vertexTraversed = {};
        if (edgeTraversed == null || edgeTraversed == undefined || !(edgeTraversed instanceof Object))
            edgeTraversed = {};

        var state = {
            "vl": {},
            "el": {}
        };

        var key;
        var vertexClass;

        // something may be inconsistent during remove (AVL?), generates mini D3 error..., hunt for that bug
        for (key in iBSTObject) {
            if (key == "root") continue;

            vertexClass = iBSTObject[key]["vertexClassNumber"]

            state["vl"][vertexClass] = {};
            state["vl"][vertexClass]["cx"] = iBSTObject[key]["cx"];
            state["vl"][vertexClass]["cy"] = iBSTObject[key]["cy"];
            state["vl"][vertexClass]["text"] = key;
            state["vl"][vertexClass]["state"] = VERTEX_DEFAULT;

            if (iBSTObject[key]["parent"] == null) continue;

            parentChildEdgeId = iBSTObject[key]["vertexClassNumber"];

            state["el"][parentChildEdgeId] = {};
            state["el"][parentChildEdgeId]["vertexA"] = iBSTObject[iBSTObject[key]["parent"]]["vertexClassNumber"];
            state["el"][parentChildEdgeId]["vertexB"] = iBSTObject[key]["vertexClassNumber"];
            state["el"][parentChildEdgeId]["type"] = EDGE_TYPE_UDE;
            state["el"][parentChildEdgeId]["weight"] = 1;
            state["el"][parentChildEdgeId]["state"] = EDGE_DEFAULT;
            state["el"][parentChildEdgeId]["animateHighlighted"] = false;
        }

        for (key in vertexTraversed) {
            vertexClass = iBSTObject[key]["vertexClassNumber"];
            state["vl"][vertexClass]["state"] = VERTEX_TRAVERSED;
        }

        for (key in edgeTraversed) {
            state["el"][key]["state"] = EDGE_TRAVERSED;
        }

        return state;
    }

    function recalculatePosition() {
        calcHeight(iBST["root"], 0);
        updatePosition(iBST["root"]);

        function calcHeight(cur, currentHeight) {
            if (cur == null) return;
            iBST[cur]["height"] = currentHeight;
            calcHeight(iBST[cur]["leftChild"], currentHeight + 1);
            calcHeight(iBST[cur]["rightChild"], currentHeight + 1);
        }

        function updatePosition(cur) {
            if (cur == null) return;

            if (cur == iBST["root"])
                iBST[cur]["cx"] = MAIN_SVG_WIDTH / 2;
            else {
                var i;
                var xAxisOffset = MAIN_SVG_WIDTH / 2 - 16;
                var parentVertex = iBST[cur]["parent"]
                for (i = 0; i < iBST[cur]["height"]; i++) xAxisOffset /= 2;

                if (parseInt(cur) > parseInt(parentVertex))
                    iBST[cur]["cx"] = iBST[parentVertex]["cx"] + xAxisOffset;
                else
                    iBST[cur]["cx"] = iBST[parentVertex]["cx"] - xAxisOffset;
            }

            iBST[cur]["cy"] = 50 + 50 * iBST[cur]["height"];
            updatePosition(iBST[cur]["leftChild"]);
            updatePosition(iBST[cur]["rightChild"]);
        }
    }

    function recalculateBalanceFactor() {
        balanceFactorRecursion(iBST["root"]);

        function balanceFactorRecursion(val) {
            if (val == null) return -1;

            var balanceFactorHeightLeft = balanceFactorRecursion(iBST[val]["leftChild"]);
            var balanceFactorHeightRight = balanceFactorRecursion(iBST[val]["rightChild"]);

            iBST[val]["balanceFactorHeight"] = Math.max(balanceFactorHeightLeft, balanceFactorHeightRight) + 1;
            iBST[val]["balanceFactor"] = balanceFactorHeightLeft - balanceFactorHeightRight;

            return iBST[val]["balanceFactorHeight"];
        }
    }

    // 1: Max
    // 2: Min
    function populatePseudocode(act) {
        switch (act) {
            case 1: // findMinMax
            case 2:
                $('#code1').html('if this is null return empty');
                if (act == 1) {
                    $('#code2').html('if right != null');
                    $('#code3').html('&nbsp&nbspgo right');
                }
                else {
                    $('#code2').html('if left != null');
                    $('#code3').html('&nbsp;&nbsp;go left');
                }
                $('#code4').html('else return this key');
                $('#code5').html('');
                $('#code6').html('');
                $('#code7').html('');
                break;
            case 4: // search
                $('#code1').html('if this == null');
                $('#code2').html('&nbsp;&nbsp;return null');
                $('#code3').html('else if this key == search value');
                $('#code4').html('&nbsp;&nbsp;return this');
                $('#code5').html('else if this key < search value');
                $('#code6').html('&nbsp;&nbsp;search right');
                $('#code7').html('else search left');
                break;
            case 0: // Insert
                $('#code1').html('if insertion point is found');
                $('#code2').html('&nbsp;&nbsp;create new vertex');
                $('#code3').html('if value to be inserted < this key');
                $('#code4').html('&nbsp;&nbsp;go left');
                $('#code5').html('else go right');
                $('#code6').html('');
                $('#code7').html('');
                break;
            case 5: // remove
                $('#code1').html('search for v');
                $('#code2').html('if v is a leaf');
                $('#code3').html('&nbsp;&nbsp;delete leaf v');
                $('#code4').html('else if v has 1 child');
                $('#code5').html('&nbsp;&nbsp;bypass v');
                $('#code6').html('else replace v with successor');
                $('#code7').html('');
                break;
            case 6: // insert with rotations
            case 7: // remove with rotations
                if (act == 6) {
                    $('#code1').html('insert v');
                } else {
                    $('#code1').html('remove v');
                }
                $('#code2').html('check Hệ số cân bằng của this and its children');
                $('#code3').html('&nbsp;&nbsp;case1: this.rotateRight');
                $('#code4').html('&nbsp;&nbsp;case2: this.left.rotateLeft, this.rotateRight');
                $('#code5').html('&nbsp;&nbsp;case3: this.rotateLeft');
                $('#code6').html('&nbsp;&nbsp;case4: this.right.rotateRight, this.rotateLeft');
                $('#code7').html('&nbsp;&nbsp;this is balanced');
                break;
            case 8: // successor
            case 9: // predecessor
                if (act == 8) {
                    $('#code1').html('if this.right != null return findMin(this.right)');
                    $('#code4').html('&nbsp;&nbsp;while(p != null && T == p.right)');
                }
                else {4
                    $('#code1').html('if this.left != null return findMax(this.left)');
                    $('#code4').html('&nbsp;&nbsp;while(p != null && T == p.left)');
                }
                $('#code2').html('else');
                $('#code3').html('&nbsp;&nbsp;p = this.parent, T = this');
                $('#code5').html('&nbsp;&nbsp;&nbsp;&nbsp;T = p, p = T.parent');
                $('#code6').html('&nbsp;&nbsp;if p is null return -1');
                $('#code7').html('&nbsp;&nbsp;else return p');
                break;
            case 3: // inorder traversal
                $('#code1').html('if this is null');
                $('#code2').html('&nbsp;&nbsp;return');
                $('#code3').html('inOrder(left)');
                $('#code4').html('visit this, then inOrder(right)');
                $('#code5').html('');
                $('#code6').html('');
                $('#code7').html('');
                break;
        }
    }
}
// BSTaction.js

// local
var bw, gw;
$(function () {
    $('#play').hide();
    bw = new BST();
    gw = bw.getGraphWidget();
    bw.generateRandom();
    var five_modes = ["BST", "AVL"];
    $('#title-' + five_modes[Math.floor(Math.random() * 2)]).click();
    var bstMode = getQueryVariable("mode");
    if (bstMode.length > 0)
        $('#title-' + bstMode).click();
    var createBST = getQueryVariable("create");
    if (createBST.length > 0) {
        var newBST = createBST.split(",");
        bw.generate(newBST);
    }

    $('#create').click(function () {
        openCreate();
        closeSearch();
        closeInsert();
        closeRemove();

    });
    $('#search').click(function () {
        closeCreate();
        openSearch();
        closeInsert();
        closeRemove();

    });
    $('#insert').click(function () {
        closeCreate();
        closeSearch();
        openInsert();
        closeRemove();

    });
    $('#remove').click(function () {
        closeCreate();
        closeSearch();
        closeInsert();
        openRemove();

    });
    $('#predsucc').click(function () {
        closeCreate();
        closeSearch();
        closeInsert();
        closeRemove();

    });
    $('#inorder').click(function () {
        closeCreate();
        closeSearch();
        closeInsert();
        closeRemove();

    });
});

// title changing
var noteTitle = document.getElementById('noteTitle');
var note = document.getElementById('noteContent');

$('#title-BST').click(function () {
    if (isPlaying) stop();
    title.innerHTML = "BINARY SEARCH TREE";
    noteTitle.innerHTML = '<h1>BINARY SEARCH TREE</h1>';
    note.innerHTML += "<div>BST là tập hợp các nút được sắp xếp theo cách mà chúng duy trì các thuộc tính của BST. Mỗi nút có một khóa và một giá trị liên quan. Trong khi tìm kiếm, khóa mong muốn được so sánh với các khóa trong BST và nếu được tìm thấy, giá trị liên quan sẽ được truy xuất.</div>"
    bw.isAVL(false);
});

$('#title-AVL').click(function () {
    if (isPlaying) stop();
    title.innerHTML = "AVL TREE";
    noteTitle.innerHTML = '<h1>AVL TREE</h1>';
    note.innerHTML = "<div>Được đặt theo tên của nhà phát minh Adelson, Velski & Landis, cây AVL là cây tìm kiếm nhị phân cân bằng độ cao. Cây AVL kiểm tra chiều cao của cây con bên trái và bên phải và đảm bảo rằng sự khác biệt không quá 1. Sự khác biệt này được gọi là Hệ số Cân bằng.</div>"
    bw.isAVL(true);
});

function empty() {
    if (isPlaying) stop();
    setTimeout(function () {
        if (bw.generateEmpty()) { // (mode == "exploration") &&
            $('#progress-bar').slider("option", "max", 0);

            isPlaying = false;
        }
    }, 500);
}

function example(id) {
    if (isPlaying) stop();
    setTimeout(function () {
        if (bw.generateExample(id)) { // (mode == "exploration") &&
            $('#progress-bar').slider("option", "max", 0);
            isPlaying = false;
        }
    }, 100);
}

function random() {
    if (isPlaying) stop();
    setTimeout(function () {
        if (bw.generateRandom()) { // (mode == "exploration") &&
            $('#progress-bar').slider("option", "max", 0);

            isPlaying = false;
        }
    }, 500);
}

function skewed(side) {
    if (isPlaying) stop();
    setTimeout(function () {
        if (bw.generateSkewed(side)) { // (mode == "exploration") &&
            $('#progress-bar').slider("option", "max", 0);
            isPlaying = false;
        }
    }, 500);
}

function findMinMax(isMin, callback) {
    if (isPlaying) stop();
    commonAction(bw.findMinMax(isMin, callback), (isMin ? "Find Minimum" : "Find Maximum"));
}

function searchVertex(callback) {
    if (isPlaying) stop();
    var input = $('#v-search').val();
    commonAction(bw.search(input, callback), "Search " + input);
    setTimeout(function () {
        if (Math.random() >= 0.5) $("#v-search").val(bw.getRandomInBST()); // 50% an existing value
        else $("#v-search").val(bw.getRandomNotInBST()); // 50% a NON existing value
    }, 500);
}

function insertVertex(callback) {
    if (isPlaying) stop();
    var input = $('#v-insert').val();
    commonAction(bw.insertArr(input.split(","), callback), "Insert " + input);
    setTimeout(function () {
        $("#v-insert").val(bw.getRandomNotInBST());
    }, 500); // randomized for next click, a NON existing value in BST
}

function removeVertex(callback) {
    if (isPlaying) stop();
    var input = $('#v-remove').val();
    commonAction(bw.removeArr(input.split(","), callback), "Remove " + input);
    setTimeout(function () {
        $("#v-remove").val(bw.getRandomInBST());
    }, 500); // randomized for next click, an existing value in BST
}

function responsivefy(svg) {
    var container = d3.select(svg.node().parentNode),
        width = parseInt(svg.style("width")) + 100,
        height = parseInt(svg.style("height")) - 100,
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
