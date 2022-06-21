import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.concurrent.locks.ReadWriteLock;

public class main {
    public static void main(String[] args) throws Exception {
        // Start receiving messages - ready to receive messages!
        try (ServerSocket serverSocket = new ServerSocket(8080)) {
            System.out.println("Server started.\n Listening for messages.");

            while (true) {
                // Handle a new incoming message
                try (Socket client = serverSocket.accept()) {
                    // client <-- messages queued up in it
                    System.out.println("Debug: got new message " + client.toString());

                    // Read the request - listen to the message
                    InputStreamReader inputStreamReader = new InputStreamReader(client.getInputStream());
                    BufferedReader bufferedReader = new BufferedReader(inputStreamReader);
                    StringBuilder requestBuilder = new StringBuilder();
                    String line = null;

                    line = bufferedReader.readLine();
                    while (!(!line.isBlank())) {
                        requestBuilder.append(line + "\r\n");
                        line = bufferedReader.readLine();
                    }
                    System.out.println("--REQUEST--");
                    System.out.println(requestBuilder.toString());

                    // Decide how we'd like to respond

                    // Just send back a simple "Hello World"

                    // Send back an image?

                    // Change response based on route?

                    // Send a response - send our reply

                    // Get ready for the next message

                }
            }
        }
    }
}
