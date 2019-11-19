import csv
import json

result = []
counter = 1
parents = []
logos = []

with open('misc.csv') as csvfile:
	readCSV = csv.reader(csvfile, delimiter=',')
	header = next(readCSV)
	for row in readCSV:
		logo = row[5]
		logo = logo.strip("{'url': '")
		logo = logo.strip("'}")
		company_name = row[3]
		new = {"name": company_name, "logo" : logo}
		logos.append(new)

with open('date_notnull_circle_pack.csv') as csvfile:
	readCSV = csv.reader(csvfile, delimiter=',')
	header = next(readCSV)
	for row in readCSV:
		parent = row[0]
		children = []
		if parent not in parents:
			child = {"name": row[3], "size": 3, "logo": ""}
			if any(d.get('name', None) == row[3] for d in logos):
				for d in logos:
					if d['name'] == row[3]:
						logo = {"logo" : d['logo']}
						child.update(logo)
			children.append(child)
			company = {"name" : parent, "children" : children, "logo": ""}
			if any(d.get('name', None) == row[0] for d in logos):
				for d in logos:
					if d['name'] == row[0]:
						logo = {"logo" : d['logo']}
						company.update(logo)
			result.append(company)
			parents.append(parent)
		elif parent in parents:
			child = {"name": row[3], "size": 3, "logo" : ""}
			if any(d.get('name', None) == row[3] for d in logos):
				for d in logos:
					if d['name'] == row[3]:
						logo = {"logo" : d['logo']}
						child.update(logo)
			for comp in result:
				if comp['name'] == parent:
					comp['children'].append(child)

#print result


variant = {}
variant = {"name": "variants", "children": result}
with open('data.json', 'w') as outfile:
    json.dump(variant, outfile)