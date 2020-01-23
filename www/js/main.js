/*
* Header
* Author Alexander RUpprecht
* Version: 1.0.0
* Beschreibung: Klasse enthält alle Methoden die von der Datenbank abhängig sind
* Copyright : Technische Hochschule Deggendorf
* Datum: 23.01.2020
*/

/**
 * <h1>Budgeteer Main-Script</h1>
 * 
 * Beschreibung:Enthält sämtliche Methoden die mit der Datenbank in Verbindung stehen 
 * @author Alexander Rupprecht
 * @version 1.0.0
 * 
 */
window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
// Verwenden Sie "var indexedDB = ..." NICHT außerhalb einer Funktion.
// Ferner benötigen Sie evtl. Referenzen zu einigen window.IDB* Objekten:
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
// (Mozilla hat diese Objekte nie mit Präfixen versehen, also brauchen wir kein window.mozIDB*)

var request = window.indexedDB.open("BudgeteerDB", 1);
var db;

request.onsuccess = function (event) {
    db = request.result;
    createStart();
};
request.onupgradeneeded = function (event) {
    db = event.target.result;
    var objectStore = db.createObjectStore("Storage", { keyPath: "id", autoIncrement: true });
    objectStore.createIndex("Bereich", "Bereich", { unique: true });
    objectStore.createIndex("Budget", "Budget", { unique: false });
    objectStore.createIndex("Rechnungen", "Rechnungen", { unique: false });
}
var currentId;
$.mobile.loading().hide();

if (!window.indexedDB) {
    alert("IndexedDB wird nicht unterstützt!");
};
/**
 * Funktion um einen neuen Bereich zu erstellen
 * @param {*} form - Formular mit Name und Betrag  
 */
function addBereich(form) {

    var bereich = form.name1.value;
    var amount = form.amount1.value;
    var rechnungen = [];

    if (amount === "" || bereich === "") {
        alert('Bitte gültige Daten eingeben');
        window.location.replace('#addBereich');
    }
    else {
        var trans = db.transaction(["Storage"], "readwrite");
        var store = trans.objectStore("Storage");
        var request = store.put({ Bereich: bereich, Budget: amount, Rechnungen: rechnungen });

        request.onsuccess = function (event) {
            createStart();
            window.location.replace("#start");
            //location.reload();         
        }

        request.onerror = function (event) {
            alert('Bitte einzigartigen Titel eingeben');
        }
    }
}

/**
 * Methode um Bereich zu löschen
 * @param {*} set - Datenset des zu löschenden Bereichs
 */
function deleteBereich(set) {

    var trans = db.transaction(["Storage"], "readwrite");
    var store = trans.objectStore("Storage");
    var request = store.delete(set.id);
    createStart();
    location.reload();
}
/**
 * Methode die Rechnung zum Bereich hinzufügt
 * @param {*} form - Formulardaten
 */
function addRechnung(form) {
    var name = form.name2.value;
    var amount = form.amount2.value;

    if (amount === "") {
        alert('Bitte gültigen Betrag eingeben');
        window.location.replace('#addRechnung');
    }
    else {
        var rechnung = new Rechnung(amount, name);
        var trans = db.transaction(["Storage"], "readwrite");
        var store = trans.objectStore("Storage");
        var row = store.get(currentId);

        row.onsuccess = function (event) {
            var trans = db.transaction(["Storage"], "readwrite");
            var store = trans.objectStore("Storage");
            var data = event.target.result;
            data.Rechnungen.push(rechnung);

            store.put(data);
            createStart();
            window.location.replace("#start");
        }
    }
}
/**
 * Methode, die Rechnung entfernt
 * @param {rechnung} rechnung - zu löschende Rechnung
 */
function deleteRechnung(rechnung) {
    var trans = db.transaction(["Storage"], "readwrite");
    var store = trans.objectStore("Storage");
    var row = store.get(currentId);

    row.onsuccess = function (event) {
        var trans = db.transaction(["Storage"], "readwrite");
        var store = trans.objectStore("Storage");
        var data = event.target.result;
        var index = data.Rechnungen.map(function (e) { return e.name }).indexOf(rechnung.name);
        data.Rechnungen.splice(index, 1);
        store.put(data);
        createStart();
        window.location.replace("#start");
    }
}

/**
 * Methode die Content von db lädt und in Startseite und Übersicht einfügt
 */
function createStart() {

    var trans = db.transaction("Storage", "readonly");
    var objectStore = trans.objectStore("Storage");

    var query = objectStore.openCursor();
    var content = document.createElement("div");
    content.setAttribute('id', 'folders');
    query.onsuccess = function (event) {
        var cursor = event.target.result;
        if (cursor) {

            var info = cursor.value;
            currentId = info.id;
            var moneyLeft = cursor.value.Budget;
            var row = document.createElement("div");
            var item = document.createElement("a");
            row.className = "BudgetListItem";
            item.setAttribute('href', '#uebersicht');
            item.setAttribute('id', info.Bereich);
            var bereichDeleter = document.createElement("input");
            bereichDeleter.setAttribute('type', 'button');
            bereichDeleter.setAttribute('value', 'x');
            bereichDeleter.setAttribute('class', 'BereichDeleter');
            bereichDeleter.setAttribute('data-role', 'none');
            bereichDeleter.addEventListener("click", function (e) { deleteBereich(info) });

            info.Rechnungen.forEach(element => { moneyLeft = moneyLeft - element.amount; });
            item.onclick = function () {

                currentId = info.id;
                var header = document.createElement("div");
                var uebersichtMoney = document.createElement("div");
                uebersichtMoney.setAttribute('id', 'MoneyLeft');
                var uebersichtMoneyText = document.createTextNode(moneyLeft + "€ übrig");
                uebersichtMoney.appendChild(uebersichtMoneyText);
                var ueberschrift = document.createTextNode(info.Bereich);
                header.setAttribute('id', 'ueberschrift');
                header.appendChild(ueberschrift);

                var child = document.getElementById('ueberschrift');
                document.getElementById("uebersichtHeader").replaceChild(header, child);

                var child2 = document.getElementById('MoneyLeft');
                document.getElementById("uebersichtHeader").replaceChild(uebersichtMoney, child2);

                var container = document.createElement("div");
                container.setAttribute('id', 'rechnungen');

                info.Rechnungen.forEach(element => {
                    var item = document.createElement("div");
                    item.setAttribute('class', 'Rechnung');
                    var label = document.createTextNode(element.name + "  " + element.amount + "€");
                    var deleter = document.createElement("input");
                    deleter.setAttribute('type', 'button');
                    deleter.setAttribute('value', 'x');
                    deleter.setAttribute('class', 'BereichDeleter');
                    deleter.setAttribute('data-role', 'none');
                    deleter.addEventListener("click", function (e) { deleteRechnung(element) });
                    item.appendChild(label);
                    item.appendChild(deleter);
                    container.appendChild(item);
                });

                var element = document.getElementById("uebersichtContent");
                var empty = document.getElementById("rechnungen");
                element.replaceChild(container, empty);
            };




            var node = document.createTextNode(cursor.value.Bereich + "  " + moneyLeft + "€/" + cursor.value.Budget + "€");
            if (moneyLeft < cursor.value.Budget / 10) {
                row.setAttribute('class', 'RedBudgetListItem');
            };
            item.appendChild(node);
            row.appendChild(item);
            row.appendChild(bereichDeleter)
            content.appendChild(row);

            cursor.continue();
        }
        else {

            var element = document.getElementById("startContent");
            var replaceable = document.getElementById("folders");
            element.replaceChild(content, replaceable);


        }
    };
}





