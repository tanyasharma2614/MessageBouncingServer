const http = require('http');

function handleRequest(req,res){
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
            if(!rawData){
                res.writeHead(400,{'Content-Type':'text/plain'});
                res.end('Bad Request: Missing or empty request body');
                return;
            }
            let parsedBody;
            let responseText;
            try{
                switch(contentType){
                    case 'text/plain':
                        parsedBody=rawData;
                        responseText=parsedBody;
                        break;
                    case 'application/json':
                        parsedBody=JSON.parse(rawData);
                        responseText=JSON.stringify(parsedBody);
                        break;
                    case 'application/x-www-form-urlencoded':
                        parsedBody=parseFormURLEncoded(rawData);
                        responseText=parsedBody;
                        break;
                    default:
                        res.writeHead(415,{'Content-Type':'text/plain'});
                        res.end('Unsupported Content-Type. Supported types: text/plain, application/json,application/x-www-form-urlencoded');
                        return;
                    }
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

function parseFormURLEncoded(data) {
    try{
        const parsedData=querystring.parse(data);
        return querystring.stringify(parsedData);
    }catch(error){
        throw new Error('Invalid form data');
    }
}
  

const server=http.createServer(handleRequest);
const port = 3000;
server.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
});

module.exports={
    handleRequest,
    isContentTypeSupported,
    parseFormURLEncoded
};