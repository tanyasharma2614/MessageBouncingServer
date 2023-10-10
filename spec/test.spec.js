const http=require('http');
const {handleRequest, isContentTypeSupported,parseFormURLEncoded}=require('../main');

const serverPort=3001;
let server;

beforeAll((done) => {
    server = http.createServer(handleRequest);
    server.listen(serverPort, () => { 
      done();
    });
  });

afterAll((done)=>{
    server.close(()=>{
        done();
    });
});

describe('Route Tests',()=>{

    function testRequest(path,contentType,data,expectedStatus,method,done){
        const options={
            hostname:'localhost',
            port:serverPort,
            path:path,
            method:method,
            headers:{
                'Content-Type':contentType,
                'Content-Length':Buffer.byteLength(data),
            },
        };
        const req=http.request(options,(res)=>{
            expect(res.statusCode).toBe(expectedStatus);
            if(expectedStatus===200){
                let responseData='';
                res.on('data',(chunk)=>{
                    responseData+=chunk;
                });
                res.on('end',()=>{
                    expect(responseData).toBe(data);
                    done();
                });
            }else{
                done();
            }
        });
        req.end(data);
    }


    it('should return 404 for a GET with valid content type and valid message',(done)=>{
        testRequest('/echo','text/plain','Hello',404,'GET',done);
    });

    it('should return 200 for a POST with valid content type and valid message',(done)=>{
        testRequest('/echo','text/plain','Hello',200,'POST',done);
    });

    it('should return 415 for a POST with valid message but unsupported content type',(done)=>{
        testRequest('/echo','application/xml','Hello',415,'POST',done);
    });

    it('should return 415 for a POSt with missing content type',(done)=>{
        testRequest('/echo','','Hello',415,'POST',done);
    });

    it('should return 404 for POST to an unknown route',(done)=>{
        testRequest('/unknown-route','text/plain','Hello',404,'POST',done);
    });

    it('should return 400 for a POST with valid content type but invalid message',(done)=>{
        testRequest('/echo','application/json','Hello',400,'POST',done);
    })

    it('should return 400 for a POST with a valid content type but empty message',(done)=>{
        testRequest('/echo','text/plain','',400,'POST',done);
    })

    it('should handle a POST with a very large message without error',(done)=>{
        const message='x'.repeat(10*1024*1024);
        testRequest('/echo','text/plain',message,200,'POST',done);
    })

});