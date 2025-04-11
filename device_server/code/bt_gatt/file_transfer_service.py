import os
from bt_gatt.service import Service, Characteristic
import dbus
from bt_gatt.constants import GATT_CHRC_IFACE
import bt_gatt.exceptions as exceptions
import logging
import hashlib
import base64
import binascii

logging.basicConfig(filename='file_transfer.log', level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

class FileTransferService(Service):
    """
    File Transfer Service with read and write characteristics.
    """
    FILE_TRANSFER_UUID = '0000180e-0000-1000-8000-00805f9b34fb'

    def __init__(self, bus, index):
        Service.__init__(self, bus, index, self.FILE_TRANSFER_UUID, True)
        self.add_characteristic(FileWriteChrc(bus, 0, self))
        self.file_data = {}  # Dictionary to store file data from different clients
        print("FileTransferService initialized")


class FileWriteChrc(Characteristic):
    FILE_WRITE_UUID = '00002a3b-0000-1000-8000-00805f9b34fb'

    def __init__(self, bus, index, service):
        Characteristic.__init__(
            self, bus, index,
            self.FILE_WRITE_UUID,
            ['read', 'write'],
            service)
        self.last_checksum = None
        self.open_files = {}
        self.storage_dir = "RobotUserFiles"
        os.makedirs(self.storage_dir, exist_ok=True)  # Ensure folder exists

    def WriteValue(self, value, options):
        client_address = options.get('client_address', 'default')
        byte_value = bytes(value)

        if byte_value.startswith(b'FILENAME:'):
            filename_raw = byte_value[len(b'FILENAME:'):].decode('utf-8')
            filename = filename_raw.replace(" ", "_")
            filepath = os.path.join(self.storage_dir, filename)
            self.open_files[client_address] = open(filepath, 'wb')
            print(f"Receiving file {filename_raw} from {client_address}, saved to {filepath}")
            return

        if byte_value == b'EOF':
            if client_address in self.open_files:
                self.open_files[client_address].close()
                del self.open_files[client_address]
            print(f"Completed file transfer from {client_address}")
            self.last_checksum = dbus.Array([], signature=dbus.Signature('y'))
            return

        try:
            self.open_files[client_address].write(byte_value)
            self.open_files[client_address].flush()
            print(f"Wrote {len(byte_value)} bytes for {client_address}")
            print(f"Data: {byte_value}")

            checksum = hashlib.sha1(byte_value).digest()
            # Hexadecimal string (same format as JS `sha1()`)
            print("🔐 SHA1 (hex):", binascii.hexlify(checksum).decode())

            # Base64 string (for BLE transmission)
            print("🔐 SHA1 (base64):", base64.b64encode(checksum).decode())

            # Optional: show raw bytes
            print("🔐 SHA1 (raw bytes):", list(checksum))
            self.last_checksum = dbus.Array(checksum, signature=dbus.Signature('y'))

        except Exception as e:
            print(f"Error writing chunk from {client_address}: {e}")
            raise exceptions.InvalidValueError(f"Write error: {e}")

    def ReadValue(self, options):
        return self.last_checksum or dbus.Array([], signature=dbus.Signature('y'))