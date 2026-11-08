/*
 * Web build (Emscripten, no threads): ai_worker.c of apps/boardgames with the bot run on the main thread.
 * bot_begin() only takes the job; the first bot_done() poll (after a frame was drawn) runs think() and
 * returns its move. Derived from RetroStone Board (MIT, (c) 2026 Pierre-Louis Boyer, 8BCraft).
 */
#include <SDL.h>
#include <string.h>

#include "ai.h"
#include "bots.h"

static struct {
    SDL_Thread *thread;
    SDL_atomic_t finished;                      /* the worker sets it last: move and ok are written then */
    const bot *b;
    int seat, level, ok;
    char move[BOT_MOVE_CAP];
    Uint32 t0;
} W;

static int run(void *arg)
{
    (void)arg;
    char m[BOT_MOVE_CAP] = "";
    int ok = W.b->think(W.seat, W.level, m, (int)sizeof m);
    m[sizeof m - 1] = 0;
    memcpy(W.move, m, sizeof m);
    W.ok = ok && !ai_cancelled() && m[0];
    SDL_AtomicSet(&W.finished, 1);              /* a full barrier: the main thread then sees move and ok */
    return 0;
}

static int pending;                             /* a job taken, think() not run yet */
static int busy;                                /* a job taken, its move not handed over yet */

int bot_begin(const bot *b, int seat, int level)
{
    if (busy || !b || !b->think) return 0;
    ai_cancel_clear();
    W.b = b;
    W.seat = seat;
    W.level = level;
    W.ok = 0;
    W.move[0] = 0;
    W.t0 = SDL_GetTicks();
    SDL_AtomicSet(&W.finished, 0);
    pending = busy = 1;
    return 1;
}

int bot_thinking(void) { return busy; }
unsigned bot_ms(void) { return SDL_GetTicks() - W.t0; }

int bot_done(char *move, int cap)
{
    if (!busy) return 0;
    if (pending) {
        pending = 0;
        run(NULL);
    }
    busy = 0;
    if (cap > 0) SDL_strlcpy(move, W.ok ? W.move : "", (size_t)cap);
    return 1;
}

void bot_halt(void)
{
    pending = busy = 0;
    ai_cancel_clear();
}
