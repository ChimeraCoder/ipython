#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

from tornado.web import url

from IPython.lib.security import passwd_check

from ..base.handlers import IPythonHandler

#-----------------------------------------------------------------------------
# Handler
#-----------------------------------------------------------------------------


class ActivateHandler(IPythonHandler):

    def get(self):
        email = self.get_argument('email', default=u'')
        token = self.get_argument('token', default=u'')

        if self.login_available:
            if email in self.password_dict:
                if self.password_dict[email]['isActive']:
                    self.write(self.render_template('signup_activation_result.html', message='Account already activated.'))
                elif passwd_check(self.password_dict[email]['token'], token):
                    self.password_dict[email]['isActive'] = True
                    self.write(self.render_template('signup_activation_result.html', message='Account activated.'))
        else:
            message = {'warning': 'Cannot activate account.  Notebook authentication '
                       'is disabled.'}
            self.redirect(self.base_project_url)



#-----------------------------------------------------------------------------
# URL to handler mappings
#-----------------------------------------------------------------------------


default_handlers = [(r"/activate", ActivateHandler)]
