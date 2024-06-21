class Currency {
    constructor(code, name) {
        this.code = code;
        this.name = name;
    }
}

class CurrencyConverter {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
        this.currencies = [];
    }

    async getCurrencies() {
        try{
            const resp = await fetch(`${this.apiUrl}/currencies`);
            const data = await resp.json();
            for(let curr in data){
                this.currencies.push(
                    new Currency(curr, data[curr])
                );
            }
        }
        catch(error){
            alert(error);
        }
    }

    async convertCurrency(amount, fromCurrency, toCurrency) {
        try{
            if(fromCurrency.code != toCurrency.code){
                const request = `/latest?amount=${amount}&from=${fromCurrency.code}&to=${toCurrency.code}`
                const resp = await fetch(`${this.apiUrl}${request}`);
                const data = await resp.json();
                return data['rates'][toCurrency.code];
            }
            else{
                return Number(amount);
            }
            
        }
        catch(error){
            return null;
        }
    }

    async getHistoricalRateDifference(fromCurrency, toCurrency){
        try{
            const date = new Date();

            //Obtención de la cotización de hoy:
            const today = date.toISOString().split('T')[0];
            let resp = await fetch(`${this.apiUrl}/${today}?from=${fromCurrency.code}&to=${toCurrency.code}`);
            let data = await resp.json();
            const todayRate = data['rates'][toCurrency.code];
            
            //Obtención de la cotización de ayer:
            date.setDate(date.getDate()-1);
            const yesterday = date.toISOString().split('T')[0];
            resp = await fetch(`${this.apiUrl}/${yesterday}?from=${fromCurrency.code}&to=${toCurrency.code}`);
            data = await resp.json();
            const yesterdayRate = data['rates'][toCurrency.code];
            
            //Devuelve la diferencia entre las cotizaciones:
            return todayRate - yesterdayRate;

        }
        catch(error){
            return null;
        }
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("conversion-form");
    const resultDiv = document.getElementById("result");
    const fromCurrencySelect = document.getElementById("from-currency");
    const toCurrencySelect = document.getElementById("to-currency");

    const converter = new CurrencyConverter("https://api.frankfurter.app");

    await converter.getCurrencies();
    populateCurrencies(fromCurrencySelect, converter.currencies);
    populateCurrencies(toCurrencySelect, converter.currencies);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const amount = document.getElementById("amount").value;
        const fromCurrency = converter.currencies.find(
            (currency) => currency.code === fromCurrencySelect.value
        );
        const toCurrency = converter.currencies.find(
            (currency) => currency.code === toCurrencySelect.value
        );
        const difference = await converter.getHistoricalRateDifference(fromCurrency, toCurrency);

        const convertedAmount = await converter.convertCurrency(
            amount,
            fromCurrency,
            toCurrency
        );

        if (convertedAmount !== null && !isNaN(convertedAmount)) {
            resultDiv.textContent = `${amount} ${
                fromCurrency.code
            } son ${convertedAmount.toFixed(2)} ${toCurrency.code} 
            ${(difference != 0)?'('+((difference > 0)?'+':'')+difference.toFixed(4)+' por unidad monetaria en relación a la cotización de ayer)':''}`;
        } else {
            resultDiv.textContent = "Error al realizar la conversión.";
        }
    });

    function populateCurrencies(selectElement, currencies) {
        if (currencies) {
            currencies.forEach((currency) => {
                const option = document.createElement("option");
                option.value = currency.code;
                option.textContent = `${currency.code} - ${currency.name}`;
                selectElement.appendChild(option);
            });
        }
    }
});
