const http = require('http');

function handleRequest(req,res){
// const server = http.createServer((req,res)=>{
    if(req.method==='POST' && req.url==='/echo'){
        const contentType=req.headers['content-type'];

        if(!isContentTypeSupported(contentType)){
            res.writeHead(415,{'Content-Type':'text/plain'});
            res.end('Unsupported Content-Type. Supported types: text/plain, application/json,application/x-www-form-urlencoded');
            return;
        }

        let rawData='';
        req.on('data',(chunk)=>{
            rawData+=chunk;
        });

        req.on('end',()=>{
            let parsedBody;
            try{
                switch(contentType){
                    case 'text/plain':
                        parsedBody=rawData;
                        break;
                    case 'application/json':
                        parsedBody=JSON.parse(rawData);
                        break;
                    case 'application/x-www-form-urlencoded':
                        parsedBody=parseFormURLEncoded(rawData);
                        break;
                    default:
                        res.writeHead(415,{'Content-Type':'text/plain'});
                        res.end('Unsupported Content-Type. Supported types: text/plain, application/json,application/x-www-form-urlencoded');
                        return;
                    }
                    const responseText = contentType === 'text/plain' ? parsedBody : JSON.stringify(parsedBody);
                    res.writeHead(200,{'Content-Type':contentType});
                    res.end(responseText);
            }catch(error){
                res.writeHead(400,{'Content-Type':'text/plain'});
                res.end(`Bad Request: Invalid message body format for Content-Type:${contentType}`);
            }
        });
    } else{
        res.writeHead(404,{'Content-Type':'text/plain'});
        res.end('Not Found');
    }
};

function isContentTypeSupported(contentType){
    const supportedTypes=['text/plain','application/json','application/x-www-form-urlencoded'];
    return supportedTypes.includes(contentType);
}

function parseFormURLEncoded(data){
    const parsedData={};
    const pairs=data.split('&');
    for(const pair of pairs){
        const [key,value] = pair.split('=');
        parsedData[key]=decodeURIComponent(value);
    }
    return parsedData;
}

const server=http.createServer(handleRequest);
const port = 3000;
server.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
});

module.exports={
    handleRequest,
    isContentTypeSupported
};