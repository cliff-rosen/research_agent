print('start')



def dec1(func):
    def wrapper(*args, **kwargs):
        print('dec1')
        return func(*args, **kwargs)
    return wrapper

def dec2(func):
    def wrapper(*args, **kwargs):
        print('dec2')
        return func(*args, **kwargs)
    return wrapper


@dec1
@dec2
def hello():
    print('hello')

hello()

