using WebSocketSharp;
using WebSocketSharp.Server;

namespace WebServer.Websocket
{
    public class SocketRefreshBehaviour : WebSocketBehavior
    {
        protected override void OnOpen()
        {

        }

        protected override void OnClose(CloseEventArgs e)
        {

        }

        protected override void OnMessage(MessageEventArgs e)
        {
            Console.WriteLine($"Message recieved : {e.Data}");
        }
    }
}
