import json

#TODO figure out best place to put this function

'''Persist the password changes that happen in-memory to disk
This should be called anytime the user credentials are modified
Eventually this should be replaced with a better approach
'''
def save_passwords(password_dct):
    #TODO figure out best way to store these
    print("saving passwords")
    with open('tmp_passwords', 'w') as fout:
        fout.write(json.dumps(password_dct))

    print("saved passwords")
    return



