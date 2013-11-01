import json


#sending email
import smtplib
from email.mime.text import MIMEText


#TODO figure out best place to put this function

'''Persist the password changes that happen in-memory to disk
This should be called anytime the user credentials are modified
Eventually this should be replaced with a better approach
'''
def save_passwords(password_dct, filename):
    #TODO figure out best way to store these
    print("saving passwords")
    with open(filename, 'w') as fout:
        fout.write(json.dumps(password_dct))

    print("saved passwords")
    return


def send_email(_from, to_email, subject, msg):
            msg['Subject'] = subject
            msg['From'] = _from
            msg['To'] = to_email
            s = smtplib.SMTP('localhost')
            s.sendmail(_from, [to_email], msg.as_string())
            s.quit()



