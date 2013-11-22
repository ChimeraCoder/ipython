//----------------------------------------------------------------------------
//  Copyright (C) 2008-2011  The IPython Development Team
//
//  Distributed under the terms of the BSD License.  The full license is in
//  the file COPYING, distributed as part of this software.
//----------------------------------------------------------------------------

//============================================================================
// Comment
//============================================================================

var IPython = (function (IPython) {
    "use strict";

    var CommentWidget = function (selector) {
        this.element = $(selector);
        this.comment_list = this.element.find('#comment_list').first();
        this.comment_input_area = this.element.find('#comment_input_area').first();
        this.comment_textarea = this.comment_input_area.find('#comment_textarea').first();
        this.load_templates();
        this.bind_events();

    };

    CommentWidget.prototype.insert_comment = function(comment_obj){
        var comment_html  = this.comment_cell_template(comment_obj);
        var comment = $(comment_html);
        comment.data('comment', comment_obj);
        this.comment_list.append(comment);
    }

    CommentWidget.prototype.load_templates = function() {
        this.comment_cell_template = function(data){
            return '<div class="comment">' +
                '  <div class="user_avatar" style="background-image:url(https://1.gravatar.com/avatar/41103dac372810b9ea1784a2cc896cab?r=x&amp;s=60);"></div>' +
                '  <div class="content">' +
                '    <div class="comment_title">' +
                '      <span class="user_name">' + data.username + '</span><span class="comment_time">' + data.time + '</span>' +
                '      <span class="reply_button"><i class="icon-reply"></i> reply</span>' +
                '    </div>' +
                '    <div class="comment_text">' + data.text+ '</div>' +
                '  </div>' +
                '</div>';
        };
        this.reply_head_template = function(data){
            return '<div id="comment_reply_to" class="btn btn-mini btn-primary"><i class="remove-mark icon-remove"></i> '+data.name+'</div>';
        };
    }

    CommentWidget.prototype.bind_events = function () {
        this.element.on('click', '.reply_button', $.proxy(this.reply_comment, this));
        this.element.on('click', '#comment_button', $.proxy(this.comment, this));
        this.element.on('click', '#comment_reply_to', $.proxy(this.remove_reply_head, this));
    };

    CommentWidget.prototype.comment = function(event){

    }

    CommentWidget.prototype.reply_comment = function(event){
        var comment = $(event.currentTarget).closest('.comment');
        var comment_obj = comment.data('comment');
        var reply_head_html  = this.reply_head_template({name: comment_obj.username});
        if(this.hasOwnProperty("reply_head")){
            this.reply_head.remove();
        }
        this.reply_head = $(reply_head_html);
        this.reply_head.appendTo(this.comment_input_area);
        this.comment_textarea.css('text-indent', this.reply_head.outerWidth());
    }

    CommentWidget.prototype.remove_reply_head = function(event){
        this.reply_head.remove();
        this.comment_textarea.css('text-indent', 0);
    }

    IPython.CommentWidget = CommentWidget;

    return IPython;

}(IPython));

