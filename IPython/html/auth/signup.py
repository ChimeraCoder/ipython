#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

import uuid

from tornado.escape import url_escape

from IPython.lib.security import passwd_check
from IPython.lib import passwd

from ..base.handlers import IPythonHandler

#-----------------------------------------------------------------------------
# Handler
#-----------------------------------------------------------------------------

class SignupHandler(IPythonHandler):

    def _render(self, message=None):
        self.write(self.render_template('login.html',
                next=url_escape(self.get_argument('next', default=self.base_project_url)),
                message=message,
        ))

    def get(self):
        if self.current_user:
            self.redirect(self.get_argument('next', default=self.base_project_url))
        else:
            self._render()

    def post(self):
        username = self.get_argument('username', default=u'')
        pwd = self.get_argument('password', default=u'')
        pwd_confirm = self.get_argument('password_confirm', default=u'')

        if self.login_available:
            if pwd != pwd_confirm:
                self._render(message={'error': 'Passwords do not match'})
                return

            self.password_dict[username] = passwd(pwd)
            self.set_secure_cookie(self.cookie_name, str(uuid.uuid4()))

        self.redirect(self.get_argument('next', default=self.base_project_url))


#-----------------------------------------------------------------------------
# URL to handler mappings
#-----------------------------------------------------------------------------


default_handlers = [(r"/signup", SignupHandler)]
