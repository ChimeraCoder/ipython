#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

import uuid

from tornado import web
from tornado.httputil import url_concat
from tornado.web import url

from IPython.lib.security import passwd_check
from IPython.lib import passwd

from ..base.handlers import IPythonHandler

#-----------------------------------------------------------------------------
# Handler
#-----------------------------------------------------------------------------


class ChangePasswordHandler(IPythonHandler):

    @web.authenticated
    def get(self):
        self.write(self.render_template('password_change.html'))

    @web.authenticated
    def post(self):
        old_pass = self.get_argument('old_password', default=u'')
        new_pass = self.get_argument('new_password', default=u'')
        new_pass_confirm = self.get_argument('new_password_confirm', default=u'')

        error_dict = {}
        if not old_pass:
            error_dict['old_password'] = "Old password required"
        if not new_pass:
            error_dict['new_password'] = "New password required"
        if new_pass != new_pass_confirm:
            error_dict['new_password_confirm'] = "Passwords do not match"
        if error_dict:
            self.write(self.render_template('password_change.html', message=error_dict))
            return

        email = self.current_user
        if not passwd_check(self.password_dict[email]['password'], old_pass):
            self.write(self.render_template('password_change.html', message={'error': 'Invalid old password'}))
        else:
            self.password_dict[email]['password'] = passwd(new_pass)
            self.write(self.render_template('password_change_successful.html'))


class ForgotPasswordHandler(IPythonHandler):
    def get(self):
        self.write(self.render_template('password_reset.html'))
    
    def post(self):
        email = self.get_argument('email', default=u'')
        
        if not self.login_available:
            self.redirect(self.base_project_url)
            return

        error_dict = {}
        if not email:
            error_dict['email'] = 'Email is required'
        elif email not in self.password_dict:
            error_dict['email'] = 'Account with this email does not exist'
        if error_dict:
            self.write(self.render_template('password_reset.html', message=error_dict))
            return

        token = str(uuid.uuid4())
        self.password_dict[email]['token'] = passwd(token)
        reset_url = url_concat('http://'+self.request.host+self.base_project_url+'password_reset', {'email':email, 'token':token})
        print reset_url
        #TODO send email

        self.write(self.render_template('password_reset_email_sent.html'))

class ResetPasswordHandler(IPythonHandler):
    def get(self):
        email = self.get_argument('email', default=u'')
        token = self.get_argument('token', default=u'')

        if self.login_available:
            if email in self.password_dict and passwd_check(self.password_dict[email]['token'], token):
                self.set_secure_cookie("reset_password_email", email)
                self.write(self.render_template('password_reset_new_password.html'))
        else:
            self.redirect(self.base_project_url)

    def post(self):
        new_pass = self.get_argument('new_password', default=u'')
        new_pass_confirm = self.get_argument('new_password_confirm', default=u'')

        if self.login_available:
            error_dict = {}
            if not new_pass:
                error_dict['new_password'] = 'New password required'
            if new_pass != new_pass_confirm:
                error_dict['new_password_confirm'] = 'Passwords do not match'
            if error_dict:
                self.write(self.render_template('password_reset_new_password.html', message=error_dict))
                return

            email = self.get_secure_cookie("reset_password_email")
            if email in self.password_dict:
                self.password_dict[email]['password'] = passwd(new_pass)
                self.write(self.render_template('password_reset_successful.html'))
            else:
                self.redirect(self.base_project_url)

#-----------------------------------------------------------------------------
# URL to handler mappings
#-----------------------------------------------------------------------------


default_handlers = [
    (r"/password_change", ChangePasswordHandler),
    (r"/forgot_password", ForgotPasswordHandler),
    (r"/password_reset", ResetPasswordHandler)]
