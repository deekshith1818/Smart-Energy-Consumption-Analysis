'''emails = ["prem@gmail.com", "notanemail", "admin@site.org", "junk", "hello@world.net"]
def valid(emails):
    for i in emails:
        if '@' in i:
            yield i 
valids=valid(emails)
username=[i.split('@')[0].upper() for i in valids]
print(username)
prices = ["$100", "$20", "N/A", "$50", "Free", "$10", "Error"]
def get_price_strings(prices):
    for price in prices:
        if price.startswith('$'):
            yield price
cleaned=get_price_strings(prices)
clean_prices=[int(price[1:]) for price in cleaned]
print(sum(clean_prices))'''
logs = ["INFO: User Login", "ERROR: Database Fail (Code 500)", "INFO: Logout", "ERROR: Connection Timeout (Code 408)", "WARNING: High Memory"]
def get_errors(loglist):
    for info in loglist:
        if 'ERROR' in info:
            yield info
error_list=get_errors(logs)
error_code=[int(code.split('Code ')[1].replace(')','' )) for code in error_list]
print(error_code)