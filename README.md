# Deck Lab BBX

App per Beyblade X: collezione di pezzi, builder del deck a pezzi unici, allenamento, tornei (anche in diretta) e meta da MetaBeys.

## Scaricare l'app (Android)

**[Scarica deck-lab-bbx.apk](https://github.com/Alzirollo/deck-lab-bbx/releases/latest/download/deck-lab-bbx.apk)**

1. Apri il link dal telefono Android.
2. Apri il file scaricato. Se Android lo chiede, consenti l'installazione di app da questa origine (di solito dal browser o da "File").
3. Per aggiornare basta scaricare e aprire di nuovo il file: i dati restano.

## Come funziona

- I dati restano sul telefono. Dalla scheda **Pezzi → Backup dei dati** puoi esportarli in un file e reimportarli su un altro dispositivo.
- Il meta si aggiorna da solo da MetaBeys quando apri l'app (se i dati hanno più di 3 giorni), oppure dalla scheda **Meta**.
- Nella scheda **Tornei** inserisci il tuo nome utente Challonge: "Cerca i miei tornei" li trova e li importa.
- I consigli e la chat di Claude ci sono solo nella versione dentro Claude.

## Per chi modifica il progetto

- La pagina dell'app è `src/app.html`, la stessa usata dentro Claude. `npm run build:www` la trasforma in `www/index.html` per Android.
- A ogni modifica caricata sul ramo `main`, GitHub costruisce l'APK e lo pubblica nella pagina [Releases](https://github.com/Alzirollo/deck-lab-bbx/releases/latest).
- La firma dell'app è in `android/app/decklab.keystore`: deve restare la stessa, altrimenti gli aggiornamenti non si installano sopra la versione precedente.
