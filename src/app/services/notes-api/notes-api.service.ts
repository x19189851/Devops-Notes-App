import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class NotesApiService {

    options;
    
    constructor(private httpClient: HttpClient,
                private authService: AuthService) { 
            this.setOptions();
    }

    setOptions() {
        let id_token = this.authService.getIdToken();

        this.options = {};
        if (id_token) {
            this.options.headers = {
                Authorization: id_token
            }
        }
    }

    addNote(item) {
        this.setOptions();
        let endpoint = process.env.API_ROOT + '/api/note';

        let itemData;
        itemData = {
            content: item.content,
            cat: item.cat
        };

        if(item.title != "") {
            itemData.title = item.title;
        }

        let reqBody = {
            Item: itemData
        };

        return this.httpClient.post(endpoint, reqBody, this.options);        
    }

    updateNote(item) {
        this.setOptions();
        let endpoint = process.env.API_ROOT + '/api/note';

        let itemData;
        itemData = {
            content: item.content,
            cat: item.cat,
            timestamp: parseInt(item.timestamp),
            note_id: item.note_id
        };

        if(item.title != "") {
            itemData.title = item.title;
        }

        let reqBody = {
            Item: itemData
        }; 

        return this.httpClient.patch(endpoint, reqBody, this.options); 
    }

    deleteNote(timestamp) {
        this.setOptions();
        let endpoint = process.env.API_ROOT + '/api/note/' + timestamp;
        return this.httpClient.delete(endpoint, this.options); 
    }

    getNotes(start?): Observable<any> {
        this.setOptions();
        let endpoint = process.env.API_ROOT + '/api/notes?limit=5';
        if(start > 0) {
            endpoint += '&start=' + start;
        }
        return this.httpClient.get(endpoint, this.options); 
    }
    
}