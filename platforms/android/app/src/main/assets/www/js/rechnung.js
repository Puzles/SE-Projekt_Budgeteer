/**
 * Klasse die eine Rechnung definiert
 */
class Rechnung {
    /**
     * Konstruktor der Rechnung erstellt
     * @param {number} amount - Rechnungbetrag
     * @param {string} name - Rechnungszweck
     */
    constructor(amount, name) {
        this.amount = amount;
        this.name = name;
    }
}