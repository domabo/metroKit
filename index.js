var owinjs = require('owinjs');
var router = require('owinjs-router');
var owinStatic = require('owinjs-static');
var razor = require('owinjs-razor');
var route = router();

var app = new owinjs.app();

app.use(route);
app.use(owinStatic('./public', {sync:true}));
app.use(owinStatic('./bootstrap-docs', {sync:true}));

app.mount('/lib', function(applet){
    applet.use(owinStatic('./lib', {sync:true}));
});

route.get('/', function routeGetDefault(){
    console.log("GET: " +this.request.path);
    var fileName = 'index.js.html';
          
    return  razor.renderViewAsync(this, fileName);
});

owinjs.createServer(app.build()).listen();

console.log('Server started');