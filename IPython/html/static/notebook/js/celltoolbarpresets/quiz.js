//----------------------------------------------------------------------------
//  Copyright (C) 2012  The IPython Development Team
//
//  Distributed under the terms of the BSD License.  The full license is in
//  the file COPYING, distributed as part of this software.
//----------------------------------------------------------------------------

//============================================================================
// CellToolbar Default
//============================================================================

/**
 * Example Use for the CellToolbar library
 */
 // IIFE without asignement, we don't modifiy the IPython namespace
(function (IPython) {
    "use strict";

    var CellToolbar = IPython.CellToolbar;

    var change_check = function(cell, checked){
        cell.metadata.isQuiz=checked;
        cell.set_draggable.apply(cell, [!checked]);
    };

    var add_quiz_checkbox = function(div, cell) {
        if(cell.cell_type=="code"){
            var checkbox_container = div;
            var checkbox = $('<input type="checkbox"/>');
            checkbox.prop('checked', cell.isQuiz());
            var label = $('<div>Quiz</div>');
            checkbox.click( function (e) {
                var checked = $(e.target).prop('checked');
                change_check(cell, checked);
            });
            label.prepend(checkbox);
            checkbox_container.append(label);
        }
    };

    CellToolbar.register_callback('quiz.change', add_quiz_checkbox);
    var quiz_preset = [];
    quiz_preset.push('quiz.change');

    CellToolbar.register_preset('Quiz', quiz_preset);
    console.log('Quiz extension loaded.');

}(IPython));
