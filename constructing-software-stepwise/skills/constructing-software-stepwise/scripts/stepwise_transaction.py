"""Serialized, crash-recoverable commits of a ledger and its generated files."""
from __future__ import annotations
import base64
import json
import os
import tempfile
import time
from contextlib import contextmanager
from pathlib import Path


def atomic_write(path: Path, value: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, name = tempfile.mkstemp(prefix='.' + path.name + '.', dir=path.parent)
    try:
        with os.fdopen(fd, 'wb') as stream:
            stream.write(value)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(name, path)
    finally:
        if os.path.exists(name):
            os.unlink(name)


def recover(directory: Path) -> None:
    journal = directory / '.stepwise-transaction.json'
    if not journal.exists():
        return
    pending = json.loads(journal.read_text())
    # A prepared journal describes a validated commit; finish it after interruption.
    for name, value in pending['files']:
        atomic_write(Path(name), base64.b64decode(value))
    journal.unlink()


@contextmanager
def locked(directory: Path):
    directory.mkdir(parents=True, exist_ok=True)
    lock = (directory / '.stepwise.lock').open('a+b')
    try:
        if os.name == 'nt':
            import msvcrt
            lock.seek(0)
            lock.write(b'0')
            lock.flush()
            lock.seek(0)
            msvcrt.locking(lock.fileno(), msvcrt.LK_LOCK, 1)
        else:
            import fcntl
            deadline = time.monotonic() + 10
            while True:
                try:
                    fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
                    break
                except BlockingIOError:
                    if time.monotonic() > deadline:
                        raise OSError('another Stepwise writer holds the ledger lock; retry after it finishes')
                    time.sleep(.05)
        recover(directory)
        yield
    finally:
        lock.close()


def commit(directory: Path, files: dict[Path, str]) -> None:
    """Validation happens before this call. Journal recovery completes interrupted writes."""
    journal = directory / '.stepwise-transaction.json'
    payload = {'files': [[str(path), base64.b64encode(text.encode()).decode()] for path, text in files.items()]}
    atomic_write(journal, json.dumps(payload).encode())
    recover(directory)
