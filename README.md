# Helfer-Männchen

Zeigt über dem Eingabefeld für jeden laufenden Sub-Agenten ein kleines oranges Pixel-Männchen
(ca. 75 px breit). Das Kostüm richtet sich nach der Aufgabe: Detektiv (Recherchieren), Koch
(Schreiben), Bauarbeiter (Bauen), Zauberer (Kreatives), Jäger (Sammeln), Astronaut (Planen).
Mehrere Helfer stehen nebeneinander, jeder in einem anderen Kostüm. Darunter stehen die Aufgabe
und was der Helfer gerade tut. Ist er fertig, bekommt er einen grünen Haken und blendet nach ein
paar Sekunden aus. Alle 2 Sekunden gleicht die Mod mit der Agentenliste ab, damit kein Männchen
hängen bleibt.

Zum Ausprobieren ohne echte Agenten: `/helfer-demo` stellt drei Probe-Männchen für etwa 20 Sekunden über das Eingabefeld.

## Installation

In einer Claude-Code-Sitzung im Terminal:

```
/plugin install helfer-maennchen --marketplace stefanritterme/helfer-maennchen
```

Danach `y` zum Hinzufügen des Marketplace und einen Bereich (scope) wählen.

Aus einer Shell:

```
claude plugin install helfer-maennchen --marketplace stefanritterme/helfer-maennchen
```

In der Desktop-App: Neben dem Eingabefeld auf + klicken, dann Plugins, Add marketplace mit `stefanritterme/helfer-maennchen`, dann Add plugin.
