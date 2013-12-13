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
        this.comment_attachment_area = this.element.find("#comment_attachment_area").first();
        this.reply_head = null;
        this.load_templates();
        this.bind_events();
    };

    CommentWidget.prototype.insert_comment = function(comment_obj){
        if (comment_obj.parent_comment_id!==null){
            var parent_comment = IPython.notebook.get_cell_by_id(comment_obj.cell_id).get_comment_by_id(comment_obj.parent_comment_id);
            if (parent_comment!==null){
                comment_obj.parent_username = parent_comment.username;
            }
        }
        var comment_html  = this.comment_cell_template(comment_obj);
        var comment = $(comment_html);
        var comment_attachment_list = comment.find('.comment_attachment_list').first();
        if(comment_obj.attachment_cells){
            for(var i=0; i<comment_obj.attachment_cells.length; i++){
                var cell = comment_obj.attachment_cells[i];
                var attachment_cell = $(this.comment_attachment_cell_template(cell));
                attachment_cell.data('cell', cell);
                attachment_cell.appendTo(comment_attachment_list);
            }
        }
        comment.data('comment', comment_obj);
        this.comment_list.append(comment);
    }

    CommentWidget.prototype.load_templates = function() {
        this.comment_cell_template = function(data){
            var html = '<div class="comment" id="comment'+data.comment_id+'">' +
                '  <div class="user_avatar" style="background-image:url(https://www.gravatar.com/avatar/'+data.user_id+'?d=identicon&amp;s=60);"></div>' +
                '  <div class="content">' +
                '    <div class="comment_title">' +
                '      <span class="user_name">' + data.username + '</span><span class="comment_time">' + new Date(data.time).format("yyyy-mm-dd hh:MM TT") + '</span>' +
                '      <span class="reply_button"><i class="icon-reply"></i> reply</span>' +
                '    </div>' +
                '    <div class="comment_text">';
            if (data.parent_username){
                html+='<a class="label label-info comment_reply" href="#comment'+data.parent_comment_id+'"><i class="icon-mail-forward"></i>' + data.parent_username+ '</a> ';
            }
            html += data.text +
                '    </div>';

            if(data.attachment_cells){
                html+='<div class="comment_attachment_list"></div>';
            }
            html+='</div>';
            return html;
        };
        this.comment_attachment_cell_template = function(cell){
            return '<div class="comment_attachment_cell label" draggable="true"><i class="icon icon-paper-clip"></i> '+cell.cell_type+' cell</div>';
        }
        this.reply_head_template = function(data){
            return '<div id="comment_reply_to" class="label label-info"><i class="remove-mark icon icon-remove"></i> '+data.name+'</div>';
        };
        this.attachment_cell_template = function(cell){
            return '<div class="attachment_cell label" data-cell-id="'+cell.metadata.cell_id+'"><i class="icon icon-paper-clip"></i> '+cell.cell_type+' cell<i class="remove-mark icon icon-remove"></div>';
        };
        this.modal_template = function(){
            return '<div id="attachment_cell_modal" class="modal hide" tabindex="-1" role="dialog" aria-hidden="true">' +
                '<div class="modal-header">' +
                '   <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>' +
                '   <h3>Viewing Cell in Comment</h3>' +
                '</div>' +
                '<div class="modal-body">' +
                '</div>' +
                '</div>';
        }
    }


    CommentWidget.prototype.bind_events = function () {
        this.element.on('click', '.reply_button', $.proxy(this.reply_comment, this));
        this.element.on('click', '#comment_button', $.proxy(this.comment, this));
        this.element.on('click', '#comment_reply_to', $.proxy(this.remove_reply_head, this));
        this.element.on('click', '.comment_reply', $.proxy(this.comment_highlight_parent, this));
        this.element.on('mouseup', '.comment_attachment_cell', $.proxy(this.display_attachment_cell, this));
        this.comment_attachment_area.on('dragenter', $.proxy(this.cell_dragenter, this));
        this.comment_attachment_area.on('dragover', $.proxy(this.cell_dragover, this));
        this.comment_attachment_area.on('dragleave', $.proxy(this.cell_dragleave, this))
        this.comment_attachment_area.on('drop', $.proxy(this.cell_drop, this))
        this.comment_attachment_area.on('click', '.attachment_cell > .remove-mark', $.proxy(this.comment_attachment_remove, this));
        this.comment_textarea.on('keydown', $.proxy(this.comment_submit, this));
        $([IPython.events]).on('dragstart.Cell', $.proxy(this.dragstart, this));
        $([IPython.events]).on('dragend.Cell', $.proxy(this.dragend, this));
    };

    CommentWidget.prototype.display_attachment_cell = function (e) {
        var cell_data = $(e.target).data('cell');
        if (!cell_data.hasOwnProperty('outputs')){// Firebase does not store the attribute when the array is empty, creating it here.
            cell_data.outputs = [];
        }
        var cell;
        if (cell_data.cell_type === 'code') {
            cell = new IPython.CodeCell();
            cell.set_input_prompt();
        } else if (cell_data.cell_type === 'markdown') {
            cell = new IPython.MarkdownCell();
        } else if (cell_data.cell_type === 'raw') {
            cell = new IPython.RawCell();
        } else if (cell_data.cell_type === 'heading') {
            cell = new IPython.HeadingCell();
        }
        cell.cm_config.readOnly = true;
        cell.fromJSON(cell_data);
        $('#attachment_cell_modal').remove();
        var modal_html = this.modal_template();
        var modal = $(modal_html);
        modal.find('.modal-body').append(cell.element);
        modal.on('shown', function(){
            cell.code_mirror.refresh();
        });
        modal.modal();
    };

    CommentWidget.prototype.comment_attachment_remove = function (e) {
        $(e.currentTarget).closest('.attachment_cell').remove();
    };

    CommentWidget.prototype.dragstart = function(e){
        this.comment_attachment_area.addClass('dragging_to');
    }

    CommentWidget.prototype.dragend = function(e){
        this.comment_attachment_area.removeClass('dragging_to');
    }

    CommentWidget.prototype.cell_dragenter = function(e){
        this.comment_attachment_area.addClass('dragover');
    }

    CommentWidget.prototype.cell_dragover= function(e){
        this.comment_attachment_area.addClass('dragover');
        e.preventDefault();
    }

    CommentWidget.prototype.cell_dragleave = function(e){
        this.comment_attachment_area.removeClass('dragover');
    }

    CommentWidget.prototype.cell_drop= function(e){
        var oe = e.originalEvent;
        var cell_data = IPython.notebook.current_dragging_cell.toJSON();
        var attachment_cell_html = this.attachment_cell_template(cell_data);
        var attachment_cell = $(attachment_cell_html);
        attachment_cell.data('cell', cell_data);
        this.comment_attachment_area.append(attachment_cell);
        this.comment_attachment_area.removeClass('dragover');
        return false;
    }

    CommentWidget.prototype.comment_submit = function(e){
        if ((e.keyCode == 10 || e.keyCode == 13) && (e.ctrlKey || e.metaKey)){
            this.comment(e);
            return false;
        }

    };

    CommentWidget.prototype.comment_highlight_parent = function(event){
        var comment = $(event.currentTarget).closest('.comment');
        var comment_obj = comment.data('comment');
        var comment_parent = $("#comment"+ comment_obj.parent_comment_id);
        $('.comment').removeClass("highlight");
        comment_parent.addClass("highlight");
    };


    CommentWidget.prototype.reset = function(event){
        this.comment_list.empty();
        this.comment_attachment_area.empty();
        this.remove_reply_head();
        this.comment_textarea.val('');
    };

    CommentWidget.prototype.comment = function(event){
        var text = this.comment_textarea.val();
        if(text!==""){

            var user_info = IPython.google_drive.user_info;
            var data = {
                username: user_info.name,
                user_id: user_info.id,
                cell_id: IPython.notebook.get_selected_cell().get_id(),
                text: text,
                time: Date.now()
            }
            if(this.reply_head){
                var comment_obj = this.reply_head.data('parent_comment');
                data.parent_comment_id = comment_obj.comment_id;
                data.parent_comment_user_id = comment_obj.user_id;
            }
            var attachment_cells = this.comment_attachment_area.find(".attachment_cell");
            attachment_cells = attachment_cells.map(function (index, element) {
                return  $(element).data('cell');
            });
            data.attachment_cells= $.makeArray(attachment_cells);
            console.log(data.attachment_cells);
            attachment_cells.remove();
            IPython.firebase.submitComment(data);
            this.comment_textarea.val('');
            this.remove_reply_head();
        }

    }

    CommentWidget.prototype.reply_comment = function(event){
        var comment = $(event.currentTarget).closest('.comment');

        var comment_obj = comment.data('comment');
        var reply_head_html  = this.reply_head_template({name: comment_obj.username});
        this.remove_reply_head();

        this.reply_head = $(reply_head_html);
        this.reply_head.data('parent_comment', comment_obj);
        this.reply_head.appendTo(this.comment_input_area);
        $('.comment').removeClass("comment_highlight");
        comment.addClass("comment_highlight");
        this.comment_textarea.css('text-indent', this.reply_head.outerWidth()+2);
        this.comment_textarea.focus();
    }

    CommentWidget.prototype.remove_reply_head = function(){
        if(this.reply_head !== null){
            this.reply_head.remove();
            this.reply_head = null;
            $('.comment').removeClass("comment_highlight");
        }
        this.comment_textarea.css('text-indent', 0);
    }

    IPython.CommentWidget = CommentWidget;

    return IPython;

}(IPython));

