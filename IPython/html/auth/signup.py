#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

import uuid

from tornado.escape import url_escape
from tornado.httputil import url_concat

from IPython.lib.security import passwd_check
from IPython.lib import passwd

from ..base.handlers import IPythonHandler

#-----------------------------------------------------------------------------
# Handler
#-----------------------------------------------------------------------------

class SignupHandler(IPythonHandler):

    def _render(self, message=None):
        self.write(self.render_template('signup.html',
                next=url_escape(self.get_argument('next', default=self.base_project_url)),
                message=message,
        ))

    def get(self):
        if self.current_user:
            self.redirect(self.get_argument('next', default=self.base_project_url))
        else:
            self._render()

    def post(self):
        email = self.get_argument('email', default=u'')
        pwd = self.get_argument('password', default=u'')
        pwd_confirm = self.get_argument('password_confirm', default=u'')

        if self.login_available:
            error_dict = {}
            if not email:
                error_dict['email'] = 'required'
            if not pwd:
                error_dict['password'] = 'required'
            if pwd != pwd_confirm:
                error_dict['password_confirm'] = 'Passwords do not match'

            if error_dict:
                self._render(message=error_dict)
                return

            token = str(uuid.uuid4())
            self.password_dict[email] = {'password': passwd(pwd), 'token': passwd(token), 'isActive':False}
            activation_url = url_concat('https://'+self.request.host+self.base_project_url+'activate', {'email':email, 'token':token})
            print activation_url
            #TODO send email

        self.write(self.render_template('signup_email_sent.html'))


#-----------------------------------------------------------------------------
# URL to handler mappings
#-----------------------------------------------------------------------------


default_handlers = [(r"/signup", SignupHandler)]
