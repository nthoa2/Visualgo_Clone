var mode = "exploration";
var codetraceColor = 'white';
actionsWidth = 0;

function highlightLine(lineNumbers) {
    $('#codetrace p').css('background-color', 'white').css('color', 'black');
    if (lineNumbers instanceof Array) {
        for (var i = 0; i < lineNumbers.length; i++)
            if (lineNumbers[i] != 0)
                $('#code' + lineNumbers[i]).css('background-color', 'black').css('color', 'white');
    }
    else
        $('#code' + lineNumbers).css('background-color', 'black').css('color', 'white');
}

var isPlaying = false;
var cur_slide = null;
var last_click = 0;

function isActionsOpen() {
    return $('#actions-hide img').hasClass('rotateRight');
}

function isStatusOpen() {
    return $('#status-hide img').hasClass('rotateRight');
}

function isCodetraceOpen() {
    return $('#codetrace-hide img').hasClass('rotateRight');
}

function showActionsPanel() {
    if (!isActionsOpen()) {
        $('#actions-hide img').removeClass('rotateLeft').addClass('rotateRight');
        $('#actions').animate({width: "+=" + actionsWidth,});
    }
}

function hideActionsPanel() {
    if (isActionsOpen()) {
        $('#actions-hide img').removeClass('rotateRight').addClass('rotateLeft');
        $('#actions').animate({width: "-=" + actionsWidth,});
    }
}

function showStatusPanel() {
    if (!isStatusOpen()) {
        $('#status-hide img').removeClass('rotateLeft').addClass('rotateRight');
        $('#current-action').show();
        $('#status').animate({width: "+=" + statusCodetraceWidth,});
    }
}

function hideStatusPanel() {
    if (isStatusOpen()) {
        $('#status-hide img').removeClass('rotateRight').addClass('rotateLeft');
        $('#current-action').hide();
        $('#status').animate({width: "-=" + statusCodetraceWidth,});
    }
}

function showCodetracePanel() {
    if (!isCodetraceOpen()) {
        $('#codetrace-hide img').removeClass('rotateLeft').addClass('rotateRight');
        $('#codetrace').animate({width: "+=" + statusCodetraceWidth,});
    }
}

function hideCodetracePanel() {
    if (isCodetraceOpen()) {
        $('#codetrace-hide img').removeClass('rotateRight').addClass('rotateLeft');
        $('#codetrace').animate({width: "-=" + statusCodetraceWidth,});
    }
}

function triggerRightPanels() {
    // hideEntireActionsPanel();
    showStatusPanel();
    showCodetracePanel();
}

function extractQnGraph(graph) {
    var vList = graph.internalAdjList;
    var eList = graph.internalEdgeList;
    for (var key in vList) {
        var temp;
        var v = vList[key];
        temp = v.cxPercentage;
        v.cxPercentage = v.cx;
        v.cx = (temp / 100) * MAIN_SVG_WIDTH;
        temp = v.cyPercentage;
        v.cyPercentage = v.cy;
        v.cy = (temp / 100) * MAIN_SVG_HEIGHT;
    }
    return graph;
}

function closeSlide(slide, callback) {
    if (typeof slide == 'undefined' || slide == null) {
        if (typeof callback == "function") callback();
        return
    }
    lectureDropdownSelect = $('#electure-dropdown');
    $(".menu-highlighted").removeClass("menu-highlighted");
    $('.electure-dialog#electure-' + slide).fadeOut(100, function () {
        var lectureDropdownSelect = $('#electure-dropdown');
        lectureDropdownSelect.detach();
        lectureDropdownSelect.appendTo('#dropdown-temp-holder');
        if (typeof callback == "function") callback();
    })
}

function canContinue() {
    var this_click = (new Date()).getTime();
    if ((this_click - last_click) < 200) return false;
    last_click = this_click;
    return true;
}

function openSlide(slide, callback) {
    mode = 'e-Lecture';
    isPlaying = false;
    if (typeof gw != 'undefined' && gw != null && typeof gw.stop == 'function' && isPlaying) {
        try {
            gw.stop();
        }
        catch (err) {
        }
    }
    if (!canContinue()) return;
    closeSlide(cur_slide, function () {
        cur_slide = slide;
        var lectureDropdownSelect = $('#electure-dropdown');
        lectureDropdownSelect.detach();
        lectureDropdownSelect.appendTo('.electure-dialog#electure-' + cur_slide);
        $('select.lecture-dropdown').val(cur_slide);
        $('.electure-dialog#electure-' + cur_slide).fadeIn(100, function () {
            if (typeof callback == "function") callback();
        });
    });
    setTimeout(function () {
        $('select.lecture-dropdown').focus();
    }, 150);
}

function initUI() {
    var actionsHeight = ($('#actions p').length) * 27 + 10;
    $('#actions').css('height', actionsHeight);
    $('#actions').css('width', actionsWidth);
    var actionsHideTop = Math.floor((actionsHeight - 16) / 2);
    var actionsHideBottom = (actionsHeight - 16) - actionsHideTop;
    $('#actions-hide').css('padding-top', actionsHideTop);
    $('#actions-hide').css('padding-bottom', actionsHideBottom);
    $('#current-action').hide();
    $('#actions-hide img').addClass('rotateRight');
    $('.action-menu-pullout').css('left', actionsWidth + 43 + 'px');
    $('.action-menu-pullout').children().css('float', 'left');

}

function end_eLecture() {
    $("#mode-menu a").trigger("click");
    hideOverlay();
    closeSlide(cur_slide);
    mode = 'exploration';
}

$(function () {
    // $("#speed-input").slider({
    //     min: 200, max: 2000, value: 1500, change: function (event, ui) {
    //         gw.setAnimationDuration(2200 - ui.value);
    //     }
    // });
    // $("#progress-bar").slider({
    //     range: "min", min: 0, value: 0, slide: function (event, ui) {
    //         gw.pause();
    //         gw.jumpToIteration(ui.value, 0);
    //     }, stop: function (event, ui) {
    //         if (!isPaused) {
    //             setTimeout(function () {
    //                 gw.play();
    //             }, 500);
    //         }
    //     }
    // });
    initUI();
    $('#mode-button').click(function () {
        $('#other-modes').toggle();
    });
    $('#mode-menu').hover(function () {
        $('#other-modes').show();
    }, function () {
        $('#other-modes').hide();
    });
    $('#other-modes a').click(function () {
        var currentMode = $('#mode-button').attr('title');
        var newMode = $(this).attr('title');
        var tmp = $('#mode-button').html().substring(0, $('#mode-button').html().length - 2);
        $('#mode-button').html($(this).html() + ' &#9663;');
        $(this).html(tmp);
        $('#mode-button').attr('title', newMode);
        $(this).attr('title', currentMode);
        if (newMode == "e-Lecture") {
            showOverlay();
            mode = "e-Lecture";
            if (isPlaying) stop();
            ENTER_LECTURE_MODE();
            if (cur_slide == null) cur_slide = ($('#electure-1').length ? '1' : '99');
            openSlide(cur_slide, function () {
                runSlide(cur_slide);
                pushState(cur_slide);
            });
        }
        else if (newMode == "exploration") {
            makeOverlayTransparent();
            mode = "exploration";
            $('.electure-dialog').hide();
            hideStatusPanel();
            hideCodetracePanel();
            showActionsPanel();
            pushState();
            ENTER_EXPLORE_MODE();
        }
        $('#other-modes').hide();
    });
    $('#status-hide').click(function () {
        if (isStatusOpen())
            hideStatusPanel(); else
            showStatusPanel();
    });
    $('#codetrace-hide').click(function () {
        if (isCodetraceOpen())
            hideCodetracePanel(); else
            showCodetracePanel();
    });
    $('#actions-hide').click(function () {
        if (isActionsOpen())
            hideEntireActionsPanel(); else
            showActionsPanel();
    });
    $('.electure-dialog .electure-end').click(end_eLecture);
    $('.electure-dialog .electure-prev').click(function () {
        openSlide($(this).attr('data-nextid'));
    });
    $('.electure-dialog .electure-next').click(function () {
        openSlide($(this).attr('data-nextid'));
    });
    $(document).keydown(function (event) {
        if (event.which == 32) {
            if (mode != "e-Lecture") {
                if (isPaused)
                    play(); else
                    pause();
            }
        }
        else if (event.which == 33) {
            if (mode == "e-Lecture" && !isPlaying)
                $('#electure-' + cur_slide + ' .electure-prev').click();
            event.preventDefault();
        }
        else if (event.which == 34) {
            if (mode == "e-Lecture" && !isPlaying)
                $('#electure-' + cur_slide + ' .electure-next').click();
            event.preventDefault();
        }
        else if (event.which == 37) {
            if (mode != "e-Lecture")
                stepBackward();
        }
        else if (event.which == 39) {
            if (mode != "e-Lecture")
                stepForward();
        }
        else if (event.which == 27) {
            if ($("#dark-overlay").css('display') == 'none') {
                stop();
                if (mode == "e-Lecture") {
                    $(".menu-highlighted").removeClass("menu-highlighted");
                    end_eLecture();
                }
                else {
                    $('#other-modes a').click();
                }
            }
        }
        else if (event.which == 35) {
            if (mode != "e-Lecture")
                stop();
        }
        else if (event.which == 189) {
            var d = (2200 - gw.getAnimationDuration()) - 100;
            $("#speed-input").slider("value", d > 0 ? d : 0);
        }
        else if (event.which == 187) {
            var d = (2200 - gw.getAnimationDuration()) + 100;
            $("#speed-input").slider("value", d <= 2000 ? d : 2000);
        }
    });
});
var isPaused = false;

function isAtEnd() {
    return (gw.getCurrentIteration() == (gw.getTotalIteration() - 1));
}

function pause() {
    if (isPlaying) {
        isPaused = true;
        gw.pause();
        $('#play').show();
        $('#pause').hide();
    }
}

function play() {
    if (isPlaying) {
        isPaused = false;
        $('#pause').show();
        $('#play').hide();
        if (isAtEnd())
            gw.replay();
        else
            gw.play();
    }
}

function stepForward() {
    if (isPlaying) {
        pause();
        gw.forceNext(250);
    }
}

function stepBackward() {
    if (isPlaying) {
        pause();
        gw.forcePrevious(250);
    }
}

function goToBeginning() {
    if (isPlaying) {
        gw.jumpToIteration(0, 0);
        pause();
    }
}

function goToEnd() {
    if (isPlaying) {
        gw.jumpToIteration(gw.getTotalIteration() - 1, 0);
        pause();
    }
}

function stop() {
    try {
        gw.stop();
    }
    catch (err) {
    }
    isPaused = false;
    isPlaying = false;
    $('#pause').show();
    $('#play').hide();
}

//Log Write
$('#status').bind("DOMSubtreeModified",function(){

    $('#log').prepend($('#status').html());

});

function clearConsole(callback) {
    $('#log').html('');
}

function removeFirstLine(){
    $('#log').find('p').first().remove();
    $('#log').find('p').first().remove();
    $('#log').find('p').first().remove();
    $('#log').find('p').first().remove();
}


function checkPlay(){
    if (isAtEnd()){
        clearConsole();
    }
}

function checkEnd(){
    if (!isAtEnd()){
        goToEnd();
    }
}