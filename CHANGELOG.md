# Changelog

## O.1.2

- Added `gmod-luadev.chattextchanged` config option, if turned on, sends code to GMod as if you were typing it in the chat, allowing external add-ons to use it (ex: coh on Metastruct).
- Added `gmod-luadev.chatheader`, `gmod-luadev.chathideother` config options. They allow for hiding contents of files that are not (G)Lua files and displaying a header at the top and bottom of every file's content.

## 0.1.1

- Moved Changelog to its own file.
- Updated manifest file.

## 0.1.0

- Initial Version
- Added sending to `server`, `shared`, `clients`, `self`, and `client`.
- Added configuration options `port` and `hidescriptname`.
