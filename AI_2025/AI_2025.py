"""
Simple expectimax-based solver for the 2025 square-merge game.
- Board is a 1D list of length size*size (default 4x4).
- Tile values are squares (1, 4, 9, 16, ...). Merge rule: equal tiles merge into next square.
"""
import math
import random
from typing import List, Tuple, Optional

SIZE = 4


def next_square(n: int) -> int:
    r = int(math.isqrt(n))
    return (r + 1) ** 2


def slide_row(row: List[int]) -> Tuple[List[int], int, bool]:
    filtered = [x for x in row if x != 0]
    out: List[int] = []
    gained = 0
    moved = False
    i = 0
    while i < len(filtered):
        cur = filtered[i]
        nxt = filtered[i + 1] if i + 1 < len(filtered) else None
        if nxt is not None and cur == nxt:
            new_val = next_square(cur)
            out.append(new_val)
            gained += new_val
            moved = True
            i += 2
        else:
            out.append(cur)
            i += 1
    while len(out) < SIZE:
        out.append(0)
    if out != row:
        moved = True
    return out, gained, moved


def move(board: List[int], direction: str) -> Tuple[List[int], int, bool]:
    grid = [board[i * SIZE : (i + 1) * SIZE] for i in range(SIZE)]
    gained_total = 0
    moved_any = False

    if direction in ("left", "right"):
        rev = direction == "right"
        for r in range(SIZE):
            row = list(reversed(grid[r])) if rev else list(grid[r])
            slid, gained, moved = slide_row(row)
            if rev:
                slid = list(reversed(slid))
            grid[r] = slid
            gained_total += gained
            moved_any = moved_any or moved
    else:
        rev = direction == "down"
        for c in range(SIZE):
            col = [grid[r][c] for r in range(SIZE)]
            col = list(reversed(col)) if rev else col
            slid, gained, moved = slide_row(col)
            if rev:
                slid = list(reversed(slid))
            for r in range(SIZE):
                grid[r][c] = slid[r]
            gained_total += gained
            moved_any = moved_any or moved

    flat = [v for row in grid for v in row]
    return flat, gained_total, moved_any


def can_move(board: List[int]) -> bool:
    for i, v in enumerate(board):
        if v == 0:
            return True
        r, c = divmod(i, SIZE)
        if c + 1 < SIZE and board[i + 1] == v:
            return True
        if r + 1 < SIZE and board[i + SIZE] == v:
            return True
    return False


def _log2_val(v: int) -> float:
    return math.log2(v) if v > 0 else 0.0


def score_board(board: List[int], gained: int = 0) -> float:
    empties = board.count(0)
    smooth = 0.0
    mono = 0.0
    # smoothness & monotonicity
    for r in range(SIZE):
        row = board[r * SIZE : (r + 1) * SIZE]
        for c in range(SIZE - 1):
            smooth -= abs(_log2_val(row[c]) - _log2_val(row[c + 1]))
            diff = _log2_val(row[c]) - _log2_val(row[c + 1])
            mono += diff if diff > 0 else -diff
    for c in range(SIZE):
        col = [board[r * SIZE + c] for r in range(SIZE)]
        for r in range(SIZE - 1):
            smooth -= abs(_log2_val(col[r]) - _log2_val(col[r + 1]))
            diff = _log2_val(col[r]) - _log2_val(col[r + 1])
            mono += diff if diff > 0 else -diff

    max_tile = max(board) if board else 0
    corner_idxs = (0, SIZE - 1, SIZE * (SIZE - 1), SIZE * SIZE - 1)
    corner_bonus = _log2_val(max_tile) if any(board[i] == max_tile for i in corner_idxs) else 0.0

    gain_log = math.log2(gained + 1) if gained else 0.0

    return (
        empties * 2000
        + smooth * 150
        + mono * 90
        + corner_bonus * 180
        + gain_log * 120
        + _log2_val(max_tile) * 40
    )


def expectimax(board: List[int], depth: int) -> float:
    if depth == 0 or not can_move(board):
        return score_board(board)

    best_score = -1e18
    moves = 0
    for direction in ("left", "up", "right", "down"):
        new_board, gained, moved = move(board, direction)
        if not moved:
            continue
        moves += 1

        empties = [idx for idx, v in enumerate(new_board) if v == 0]
        if not empties:
            # no space to spawn, evaluate directly
            score = score_board(new_board, gained)
        else:
            total = 0.0
            # chance node: 1 with 0.8, 4 with 0.2
            for pos in empties:
                for val, prob in ((1, 0.8), (4, 0.2)):
                    temp = new_board[:]
                    temp[pos] = val
                    total += prob * expectimax(temp, depth - 1)
            score = total / len(empties)
        best_score = max(best_score, score)

    if moves == 0:
        return score_board(board)
    return best_score


def choose_move(board: List[int], depth: int = 3) -> Optional[str]:
    """Return best direction among left/up/right/down or None if no moves."""
    best_dir = None
    best_score = -1e18
    for direction in ("left", "up", "right", "down"):
        new_board, gained, moved = move(board, direction)
        if not moved:
            continue
        empties = [idx for idx, v in enumerate(new_board) if v == 0]
        if empties:
            total = 0.0
            for pos in empties:
                for val, prob in ((1, 0.8), (4, 0.2)):
                    temp = new_board[:]
                    temp[pos] = val
                    total += prob * expectimax(temp, depth - 1)
            score = total / len(empties)
        else:
            score = score_board(new_board, gained)
        if score > best_score:
            best_score = score
            best_dir = direction
    return best_dir


if __name__ == "__main__":
    # quick smoke test
    start = [0] * 16
    start[0] = start[1] = 1
    print("best move:", choose_move(start, depth=3))
