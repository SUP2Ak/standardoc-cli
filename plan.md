## Plan standardoc-cli

- Add internal commande to get version of cli (That will be utils for vscode extension and merge data)
- Reconfig le projet sur les builds 
- Parser fichier code source :

- Parser fichier docs :
- Structure quand on init : 
  - [.standardoc](folder) (cli: standardoc init <projet>) si argument projet existe c'est le nom du dossier qu'on ajouteras dans .standardoc/projets/ 
    - [projects](folder) (empty folder per default)
      -[{projetName}](folder)
        - settings.json (optionnal, if exist, that overwrite settings.json in [.standardoc](folder) )
        - docs.json
    - settings.json (default settings)


## Plan standardoc vscode extension



- Interface
  - Quand on ouvre celle-ci elle doit chercher le dossier .standardoc, si elle ne trouve pas cliquer sur init qui lui fait la command init sur le cli, dans le