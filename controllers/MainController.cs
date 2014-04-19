using System;
using System.Diagnostics;
using System.Collections.Generic;
using Domaba.Framework;
using Domaba.Owin;
using Domaba.Framework.Websockets;
using System.Threading.Tasks;

namespace Domaba.Content.Sample
{
    public class MainController : ApiController
	{
        public MainController()
        {
          //  AppContext.Current.Name ="metro bootstrap";
        }

  /*      [GET("/login")]
        public static IApiControllerResponse Login(string url)
        {
            if (url==null)
            {
                UriBuilder o = new UriBuilder(currentContext.Request.Uri.GetBaseUri());
                o.Path += currentContext.DefaultPath;
                url = o.Uri.ToString ();
            }
            Debug.WriteLine ("logging in from " + url);
            return new ControllerResponseHTML(CurrentContext.RazorView.Parse("views/Login.cstml", currentContext));
   }
                       
        [POST("/login/process")]
        public static object LoginProcess(loginModel loginModel)
        {
            if (loginModel.password == "TEST") {
                string _globalAuthId = Guid.NewGuid().ToString ();
                var _claims = new List<Claim> ();
                _claims.Add (new Claim(ClaimTypes.Email, loginModel.email));
                _claims.Add (new Claim(ClaimTypes.Name, "Guy"));
                var _identity = new ClaimsIdentity (_claims, "RAZOR", _globalAuthId);
                currentContext.Request.User= new ClaimsPrincipal(_identity);

                if (string.IsNullOrEmpty(loginModel.url))
                {
                    UriBuilder o = new UriBuilder(currentContext.Request.Uri.GetBaseUri());
                    o.Path += currentContext.DefaultPath;
                    return new ControllerResponseRedirect (o.Uri.ToString ());
                }
                else
                {
                    return new ControllerResponseRedirect (loginModel.url);
                }
            } else
                return CurrentContext.RazorView.Parse ("views/Login.cshtml", currentContext);
        }

        [GET("/logout")]
        public static IApiControllerResponse Logout()
        {
            currentContext.Request.User = null;
            return new ControllerResponseHTML(CurrentContext.RazorView.Parse ("web/Index.cshtml", currentContext));
        }
*/
        [Authorize]
   		[GET("/customer/{id}"), GET("/customer")]
		public static string GetCustomer(customer customer)
		{

            var x = CurrentContext.Request.GetExternalIdentity ().WaitResult ();
            Debug.WriteLine (x.Name);
            var OwinIdentity = new OwinIdentity (x);

            foreach (var owinClaim in OwinIdentity.Claims) {
                 Debug.WriteLine (owinClaim.Type + " " + owinClaim.Value + " " + owinClaim.Issuer);
            }

          	CurrentContext.Response.ContentType = "text/html";
            return CurrentContext.RazorView.Parse<customer>("views/ViewCustomer.vbhtml", CurrentContext, customer);
		}

		[GET("/subscribe/sockettest")]
		public void WebSocket_SocketTest()
		{
            if (CurrentContext.WebSocketUpgradeable)
                CurrentContext.Request.AcceptWebSocketRequest (new Socket1 ());
            else
                CurrentContext.Response.StatusCode = (int)System.Net.HttpStatusCode.BadRequest;
  		} 

        [GET("/google")]
        public string Google()
        {
            var httpClient = new OwinHttpClient (CurrentContext.Dictionary);
            var request = OwinRequest.Create (new Uri ("http://www.google.com"));
            httpClient.RequestAsync.Invoke (request.Environment).Wait ();
            var response = new OwinResponse (request.Environment);
            return (response.GetBodyString ());
        } 


        [GET("/Account/Logout")]
        public IApiControllerResponse AccountLogout()
        {

            CurrentContext.Response.SignOut =  new string[] {"External", "Google"};
            return new ControllerResponseRedirect(CurrentContext.Request.BaseUri.OriginalString);

        }

        [GET("/Account/Login")]
        public string AccountLogin(string ReturnUrl)
        {
            if (ReturnUrl == null)
                ReturnUrl = CurrentContext.Request.BaseUri.OriginalString;

            Debug.WriteLine ("LOGGIN IN THEN RETURNING TO " + ReturnUrl);
            var model = new loginModel ();
            model.url = System.Uri.EscapeDataString( ReturnUrl);
            Debug.WriteLine ("LOGGIN IN THEN RETURNING TO " + model.url);

            return CurrentContext.RazorView.Parse("views/LoginOwin.cshtml", CurrentContext, model);
        }

        [POST("/Account/LoginExternal")]
        public void AccountLoginExternal(string ReturnUrl)
        {
            if (ReturnUrl == null) {
                CurrentContext.Response.StatusCode = (int)System.Net.HttpStatusCode.BadRequest;
                return;
            }

            foreach (var x in CurrentContext.ApiForm)
            {
                Debug.WriteLine (x.Key + ": " + x.Value);
            }
            var provider = CurrentContext.ApiForm.GetValueOrDefault ("provider", "");
            var returnUrl = CurrentContext.AbsoluteUrl(CurrentContext.ApiController.GetActionUrl("MainController.AccountOAuthReturn", System.Uri.EscapeDataString(ReturnUrl)));


            if (provider != "")
                CurrentContext.Response.SetChallenge (new string[] {provider}, returnUrl);
            else
                CurrentContext.Response.StatusCode = (int)System.Net.HttpStatusCode.BadRequest;

        }

        [GET("/Account/OAuthReturn")]
        public IApiControllerResponse AccountOAuthReturn(string ReturnUrl)
        { 
            if (ReturnUrl == null) {
                ReturnUrl = CurrentContext.Request.BaseUri.OriginalString;
            } else
                ReturnUrl = new Uri (CurrentContext.Request.BaseUriSchemeServer, ReturnUrl).OriginalString ;


            var x = CurrentContext.Request.GetExternalIdentity ().WaitResult ();
    
            return new ControllerResponseRedirect(ReturnUrl);
        }
	}

    internal class Socket1 : WebSocketHandler
    {
        static int ConnectedWebSocketsCount;
        private int SessionId;

        public override void OnOpen ()
        {
            this.Send("Hi there");
            ConnectedWebSocketsCount ++;
            Debug.WriteLine((ConnectedWebSocketsCount+1) + " web socket clients connected inline");
            SessionId = ConnectedWebSocketsCount;

        }

        public override void OnMessage(string message)
        {
            Debug.WriteLine("WebSocket Received: " + SessionId.ToString() + " " + message);
            this.Send("it certainly does rock");
      
        }

        public override void OnClose ()
        {
            ConnectedWebSocketsCount --;
            base.OnClose ();
        }
    }
}
