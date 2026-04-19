import sqlite3, os
db_path = os.path.join(os.environ['LOCALAPPDATA'], 'ProfileSubmissionAssistant', 'data.db')
db = sqlite3.connect(db_path)
c = db.cursor()

c.executescript('''
CREATE TABLE IF NOT EXISTS Personas (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    FirstName TEXT,
    LastName TEXT,
    Username TEXT,
    Bio TEXT,
    WebsiteUrl TEXT,
    Email TEXT,
    Password TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Campaigns (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    ProjectId INTEGER,
    PersonaId INTEGER,
    Status TEXT DEFAULT 'Idle',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(ProjectId) REFERENCES Projects(Id),
    FOREIGN KEY(PersonaId) REFERENCES Personas(Id)
);
''')

# Add CampaignId to SiteTasks if it doesn't exist
try:
    c.execute('ALTER TABLE SiteTasks ADD COLUMN CampaignId INTEGER REFERENCES Campaigns(Id)')
    print('Added CampaignId to SiteTasks')
except sqlite3.OperationalError as e:
    if 'duplicate column name' in str(e).lower():
        print('CampaignId already exists')
    else:
        print('Error:', e)

db.commit()
db.close()
print("Database schema updated successfully!")
