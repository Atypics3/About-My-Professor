import json

seen = {}
with open('prof_link.json', 'r') as file:
    data = json.load(file)
    for name in data:
        uid = data[name].split("uid=", 1)[1]
        seen[name] = uid
        
            
with open("prof_uid.json", "w", encoding='utf-8') as file:
    json.dump(seen, file, indent=4, ensure_ascii=False)
            