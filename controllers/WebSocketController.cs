using Domaba.Framework;
using System;
using System.Diagnostics;
using Domaba.Owin;
using Domaba.Framework.Websockets;
using System.Threading.Tasks;

namespace Domaba.Content.Sample
{

    public class WebSocketController : ApiController
	{

        private WebSocketCollection collection2 = new WebSocketCollection();
        private WebSocketCollection collection3 = new WebSocketCollection();

		[GET("/subscribe")]
		public void OnConnect(customer cust)
		{
            if (!CurrentContext.WebSocketUpgradeable) {
                CurrentContext.Response.StatusCode = (int)System.Net.HttpStatusCode.BadRequest;
                return;
            }

            CurrentContext.Request.AcceptWebSocketRequest (new ProgressHandler (collection2, cust, new Action<ProgressHandler>(OnOpenAsync)));
		}

		[GET("/ProgressContinue")]
		public void OnProgressContinue(customer cust)
		{
            if (!CurrentContext.WebSocketUpgradeable) {
                CurrentContext.Response.StatusCode = (int)System.Net.HttpStatusCode.BadRequest;
                return;
            }

            CurrentContext.Request.AcceptWebSocketRequest (new ProgressHandler (collection3, cust, new Action<ProgressHandler> (OnOpenAsync2)));
	    }

        private void OnOpenAsync(ProgressHandler progress)
        {
            CurrentContext = new OwinContext (progress.WebSocketContext.Environment);

            progress.IsCancelled = false;
            for (byte i = 0; i <= 100; i += 5) {

                progress.StatusUpdate (new WebSocketStatusMessageEventArgs ("Progress = " + i + "%", i));
                var x = new System.Threading.ManualResetEvent (false);
                x.WaitOne (200);
                if (progress.IsCancelled) {
                    return; 
                }
            }

            var ProgressContinueUrl = CurrentContext.RazorView.GetUrl (typeof(ProgressContinue), progress.Customer);
                   progress.StatusUpdate (new WebSocketStatusMessageEventArgs ("!" + ProgressContinueUrl));

        }

        private void OnOpenAsync2(ProgressHandler progress)
        {
            CurrentContext = new OwinContext (progress.WebSocketContext.Environment);

            progress.IsCancelled = false;
            for (byte i = 0; i <= 100; i += 5) {

                progress.StatusUpdate (new WebSocketStatusMessageEventArgs ("Progress = " + i + "%", i));
                var x = new System.Threading.ManualResetEvent (false);
                x.WaitOne (200);
                if (progress.IsCancelled) {
                    return; 
                }
            }

            progress.StatusUpdate (new WebSocketStatusMessageEventArgs ("!" + CurrentContext.DefaultPath));

        }
    }

    internal class ProgressHandler : WebSocketHandler
    {
        public bool IsCancelled {get; set;}
        private WebSocketCollection _clientTopicCollection;
        public customer Customer;
        private Action<ProgressHandler> _openCallback;

        internal ProgressHandler(WebSocketCollection clientTopicCollection, customer cust, Action<ProgressHandler> openCallback)
        {
            _openCallback= openCallback;
            _clientTopicCollection= clientTopicCollection;
            clientTopicCollection.Add(this);
            Customer=cust;
        }

        public void StatusUpdate(WebSocketStatusMessageEventArgs e)
        {
            _clientTopicCollection.Broadcast (e.Text);
            if (e.Percentage < byte.MaxValue) {
                _clientTopicCollection.Broadcast ("%" + e.Percentage.ToString().Trim());
            }
        }

        public override void OnOpen ()
        {
            Task.Factory.StartNew (() => {
                _openCallback.Invoke (this);});
        }

        public override void OnMessage(string msg)
        {
            switch (msg.Substring(0, 1)) {
                case ">":
                if (msg == ">CANCEL") {
                    this.Send("/");
                    IsCancelled = true;
                    Debug.WriteLine("Aborting Services for " + Customer.id);
                }
                break;
                default:
                Debug.WriteLine("WebSocket Received: "+ Customer.id +msg);
                break;
            }
        }

        public override void OnClose ()
        {
            IsCancelled = true;
            Debug.WriteLine("Aborting Services Due to Disconnected Socket " + Customer.id);
        }

    }

    public class WebSocketStatusMessageEventArgs : EventArgs
    {
        public string Text;

        public byte Percentage;
        public WebSocketStatusMessageEventArgs(string text, byte percentage)
        {
            this.Text = text;
            this.Percentage = percentage;
        }

        public WebSocketStatusMessageEventArgs(string text)
        {
            this.Text = text;
            this.Percentage = byte.MaxValue;
        }
    }
}
