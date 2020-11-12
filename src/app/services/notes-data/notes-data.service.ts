import { Injectable } from '@angular/core';
import { Subject }    from 'rxjs/Subject';

@Injectable()
export class NotesDataService {

    private announceAddNoteSource = new Subject();
    addNote$ = this.announceAddNoteSource.asObservable();

    constructor() { }

    // announceRefreshNotes() {
    //     this.announceRefreshNotesSource.next();
    // }

    announceAddNote(note) {
        this.announceAddNoteSource.next(note);
    }
}