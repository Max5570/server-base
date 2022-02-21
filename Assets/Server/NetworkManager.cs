using Firesplash.UnityAssets.SocketIO;
using UnityEngine;
using UnityEngine.UI;

public class NetworkManager : MonoBehaviour//UnitySingletonPersistent<NetworkManager>
{
    public SocketIOCommunicator Socket { get; set; }

    public Text Text;
    public InputField InputField;
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
        InputField.onValueChanged.AddListener(UpdateServerInfo);
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
            Socket = GetComponent<SocketIOCommunicator>();
        }
        SetupEvents();
    }

    public void Disconnect()
    {
        if (CurrentStatus == Status.connected)
        {
            CurrentStatus = Status.tryingDisconnect;
            Socket.Instance.Close();
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

        Socket.Instance.On("connect", (e) =>
        {
            Socket.Instance.Emit("connection");
            Debug.Log("Connection made to the server");
            CurrentStatus = Status.connected;
        });

        Socket.Instance.On("error", (payload) =>
        {
            Debug.Log("Connection error to the server\nError name: " + payload + "\nErrorData: " + payload);
        });

        Socket.Instance.On("Close", (payload) =>
        {
            Debug.Log("[SocketIO] Close: " + payload + " " + payload);

            CurrentStatus = Status.destroySocket;
            Disconnect();
            Destroy(Socket.gameObject);
        });
        
        Socket.Instance.On("update", (payload) =>
        {
            Debug.Log("update: " + payload);
            Text.text = payload;
        });
        #endregion
    }
    
    

    public void UpdateServerInfo(string info)
    {
        Debug.Log(info);
        Socket.Instance.Emit("update", info);
    }
}