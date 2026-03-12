-- Beispiel-Fragen für Topscale Quiz Game
-- Ausführen mit: ddev exec mysql db < seed-questions.sql

-- Fragengruppe erstellen
INSERT INTO QuestionGroup (Title, Only18, Created, LastEdited) VALUES
('Allgemeinwissen', 0, NOW(), NOW()),
('Film & Fernsehen', 0, NOW(), NOW()),
('Emotionen', 1, NOW(), NOW());

-- Fragen für "Allgemeinwissen" (GroupID = 1)
INSERT INTO Question (Content, ScaleStart, ScaleEnd, GroupID, Created, LastEdited) VALUES
('Nenne eine Stadt in Deutschland', 'Sehr klein (unter 5.000 Einwohner)', 'Sehr groß (über 1 Million Einwohner)', 1, NOW(), NOW()),
('Nenne ein Tier', 'Sehr klein (Insekt)', 'Sehr groß (Elefant, Wal)', 1, NOW(), NOW()),
('Nenne ein Getränk', 'Kein Alkohol', 'Sehr hochprozentig', 1, NOW(), NOW()),
('Nenne ein Land', 'Sehr klein (z.B. Monaco)', 'Sehr groß (z.B. Russland)', 1, NOW(), NOW()),
('Nenne einen Beruf', 'Wenig Verantwortung', 'Sehr viel Verantwortung', 1, NOW(), NOW());

-- Fragen für "Film & Fernsehen" (GroupID = 2)
INSERT INTO Question (Content, ScaleStart, ScaleEnd, GroupID, Created, LastEdited) VALUES
('Nenne einen Film', 'Sehr fröhlich/lustig', 'Sehr traurig/dramatisch', 2, NOW(), NOW()),
('Nenne eine Fernsehserie', 'Sehr kurz (1 Staffel)', 'Sehr lang (10+ Staffeln)', 2, NOW(), NOW()),
('Nenne einen Schauspieler', 'Eher unbekannt', 'Weltberühmt', 2, NOW(), NOW());

-- Fragen für "Emotionen" (GroupID = 3, nur 18+)
INSERT INTO Question (Content, ScaleStart, ScaleEnd, GroupID, Created, LastEdited) VALUES
('Nenne etwas, das du heimlich tust', 'Total harmlos', 'Ziemlich peinlich', 3, NOW(), NOW()),
('Nenne einen Ort für ein Date', 'Sehr romantisch', 'Sehr unromantisch', 3, NOW(), NOW());

SELECT 'Erfolgreich eingefügt!' AS Status, 
       (SELECT COUNT(*) FROM QuestionGroup) AS 'Fragengruppen',
       (SELECT COUNT(*) FROM Question) AS 'Fragen';
