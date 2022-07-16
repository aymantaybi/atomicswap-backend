const formatValue = (value: string | any[]) => {
    value = String(value)
    return value.length < 2 ? `0${value}` : value;
}

const formatTime = (timestamp: any, round: number = 5) => {

    const date = new Date(Number(String(timestamp).padEnd(13, "0")));

    var fullYear = formatValue(date.getFullYear().toString());
    var month = round > 0 ? formatValue((date.getMonth() + 1).toString()) : "00";
    var day = round > 1 ? formatValue(date.getDate().toString()) : "00";

    var hours = round > 2 ? formatValue(date.getHours().toString()) : "00";
    var minutes = round > 3 ? formatValue(date.getMinutes().toString()) : "00"
    var secondes = round > 4 ? formatValue(date.getSeconds().toString()) : "00";

    return `${fullYear}-${month}-${day}T${hours}:${minutes}:${secondes}`;
}

export default formatTime;