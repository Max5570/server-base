using UnityEngine;
using SocketIO;
using Server;

public class NetworkManager : MonoBehaviour//UnitySingletonPersistent<NetworkManager>
{
    public SocketIOComponent SocketPrefab = default;
    public SocketIOComponent Socket { get; set; }

    private bool _isSocketNull
    {
        get => Socket == null || Socket.Equals(null);
    }

    public enum Status
    {
        tryingConnect,
        tryingDisconnect,
        connected,
        destroySocket,
        disconnected
    }
    
    public Status CurrentStatus = Status.disconnected;

    private void Start()
    {
        Connect();
    }

    private void Update()
    {
        CheckDisconnecting();
    }

    public void Connect()
    {
        if (CurrentStatus == Status.disconnected)
        {
            CurrentStatus = Status.tryingConnect;
            Socket = Instantiate(SocketPrefab, gameObject.transform);
        }
        SetupEvents();
    }

    public void Disconnect()
    {
        if (CurrentStatus == Status.connected)
        {
            CurrentStatus = Status.tryingDisconnect;
            Socket.Close();
        }
    }

    private void CheckDisconnecting()
    {
        if (CurrentStatus == Status.destroySocket)
        {
            if (_isSocketNull)
            {
                CurrentStatus = Status.disconnected;
            }
        }
    }

    private void SetupEvents()
    {
        #region SocketIO C# library events
        Socket.On("open", (e) =>
        {
            Socket.Emit("connection");
            Debug.Log("Connection made to the server");
            CurrentStatus = Status.connected;
        });

        Socket.On("error", (e) =>
        {
            Debug.Log("Connection error to the server\nError name: " + e.name + "\nErrorData: " + e.data);
        });

        Socket.On("Close", (e) =>
        {
            Debug.Log("[SocketIO] Close: " + e.name + " " + e.data);

            CurrentStatus = Status.destroySocket;
            Disconnect();
            Destroy(Socket.gameObject);
        });
        #endregion
    }

    #region DB
    /// <returns>Error detected.</returns>
    public bool DBCheckError(JSONObject data, out string error)
    {
        error = data["error"].ToString().RemoveQuotes();
        if (!string.IsNullOrEmpty(error))
        {
            return true;
        }
        return false;
    }
    #endregion
}