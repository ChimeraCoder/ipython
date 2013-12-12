//----------------------------------------------------------------------------
//  Copyright (C) 2008-2011  The IPython Development Team
//
//  Distributed under the terms of the BSD License.  The full license is in
//  the file COPYING, distributed as part of this software.
//----------------------------------------------------------------------------

//============================================================================
// Statistic For Quiz
//============================================================================

var IPython = (function (IPython) {
    "use strict";

    var StatWidget = function (selector) {
        this.element = $(selector);
        this.success_count = this.element.find('#stat_success > .stat_data_value').first();
        this.fail_count = this.element.find('#stat_fail > .stat_data_value').first();
        this.total_count = this.element.find('#stat_total > .stat_data_value').first();

    };


    StatWidget.prototype.update = function (cell) {
        if(cell.isQuiz()&&IPython.notebook.isAuthor()){
            var data = cell.stat;
            this.success_count.text(data.success);
            this.fail_count.text(data.fail);
            this.total_count.text(data.total);
            this.show();
        }else{
            this.hide();
        }


    };

    StatWidget.prototype.show = function () {
        this.element.removeClass('hide');
    };

    StatWidget.prototype.hide = function () {
        this.element.addClass('hide');
    };


    IPython.StatWidget = StatWidget;

    return IPython;

}(IPython));

