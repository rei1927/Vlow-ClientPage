const regex = /(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp|pdf)(?:\?[^\s]*)?)/i;
const text = "Ini gambarnya ya: https://minio.dayamedialangit.co.id/vlow-client/knowledge/85701e7f-2123-4ab9-a80d-24f3d0125e34/b5e032c4-8d4b-44e7-ade9-fd6ccf61b675.jpeg";
const match = text.match(regex);
console.log(match ? match[1] : "No match");
