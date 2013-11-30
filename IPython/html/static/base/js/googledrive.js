//----------------------------------------------------------------------------
//  Copyright (C) 2012  The IPython Development Team
//
//  Distributed under the terms of the BSD License.  The full license is in
//  the file COPYING, distributed as part of this software.
//----------------------------------------------------------------------------

//============================================================================
// Notebook
//============================================================================

/**
 * @module IPython
 * @namespace IPython
 * @submodule GoogleDrive
 **/

var IPython = (function (IPython) {
    "use strict";

    var GoogleDrive = function(client_id){
        this.client_id = client_id;
        this.scopes = [
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
        ];
        this.drive_api_loaded = false;
        this.load_google_api_client();
    }


    GoogleDrive.prototype.load_google_api_client = function() {
        window['gapi_onload'] = $.proxy(this.handle_client_load, this);
        $.ajax({
            url: "https://apis.google.com/js/client.js",
            dataType: "script",
            cache: true
        });
    }

    GoogleDrive.prototype.handle_client_load = function() {
        this.check_auth();
    }

    GoogleDrive.prototype.check_auth = function() {
        gapi.auth.authorize(
            {'client_id': this.client_id, 'scope': this.scopes, 'immediate': true},
            $.proxy(this.handle_auth_result,this));
    }


    GoogleDrive.prototype.wait_for_drive_api = function(callback) {
        if(this.drive_api_loaded){
            callback();
        }else{
            $([IPython.events]).on('drive_api_loaded.GoogleDrive',callback);
        }
    }

    GoogleDrive.prototype.handle_drive_api_load = function() {
        this.drive_api_loaded = true;
        $([IPython.events]).trigger('drive_api_loaded.GoogleDrive');
    }

    GoogleDrive.prototype.handle_auth_result = function(authResult) {
        if (authResult) {
            gapi.client.load('drive', 'v2', $.proxy(this.handle_drive_api_load,this));
            this.setUserInfo();
            $([IPython.events]).trigger('authorization_complete.GoogleDrive');
        } else {
            $([IPython.events]).trigger('authorization_required.GoogleDrive');
        }
    }

    GoogleDrive.prototype.authorize = function () {
        gapi.auth.authorize(
                {'client_id': this.client_id, 'scope': this.scopes, 'immediate': false},
                $.proxy(this.handle_auth_result,this));
    }

    GoogleDrive.prototype.revoke = function () {
        gapi.auth.signOut();
        var token = gapi.auth.getToken();
        var revokeUrl = 'https://accounts.google.com/o/oauth2/revoke?token=' + token.access_token;
        var that = this;
        $.ajax({
            type: 'GET',
            url: revokeUrl,
            async: false,
            contentType: "application/json",
            dataType: 'jsonp',
            success: function(nullResponse) {
                that.check_auth();
            },
            error: function(e) {
            }
        });
    }


    GoogleDrive.prototype.setUserInfo = function(){
        var that = this;
        gapi.client.load('oauth2','v2', function(){
            var request = gapi.client.oauth2.userinfo.get();
            request.execute(function(resp) {
                that.user_info = resp;
            });
        });
    }

    IPython.GoogleDrive = GoogleDrive;

    return IPython;

}(IPython));
