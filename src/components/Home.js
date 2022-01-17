import axios from "axios";
import React, { useEffect, useState, useMemo } from "react";
import { useHistory, useLocation } from "react-router";
import { getToken, setToken } from "../helper";
import FullCalendar from "@fullcalendar/react"; // must go before plugins
import dayGridPlugin from "@fullcalendar/daygrid"; // a plugin!
import timeGridPlugin from "@fullcalendar/timegrid";
import { APIS, SCOPES, TRIGGER_URL } from "../constants";
import ReactLoading from 'react-loading';


const updateQueryStringParameter = (uri, key, value) => {
  var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
  var separator = uri.indexOf("?") !== -1 ? "&" : "?";
  if (uri.match(re)) {
    return uri.replace(re, "$1" + key + "=" + value + "$2");
  } else {
    return uri + separator + key + "=" + value;
  }
};

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

const Home = () => {
  // store the tokens if available
  const query = useQuery();
  const history = useHistory();
  const loginKey = query.get("loginKey");
  const loginToken = query.get("loginToken");
  const [calendars, setCalendars] = useState();
  const [userLoggedIn, setUserLoggedIn] = useState(0);
  const [theCodeMeshTokens, setTheCodeMeshTokens] = useState(0);
  const [loginUrl, setLoginUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [eventsData, setEventsData] = useState([]);

  const getEvents = () => {
    const events = [];
    eventsData.forEach(dataItem => {
      dataItem.items.forEach(eventItem => {
        events.push({ title: eventItem.summary, start: eventItem.start.date ?? eventItem.start.dateTime, end: eventItem.end.date ?? eventItem.end.dateTime });
      });
    });
    return events;
  };

  if (loginToken && loginKey && window && localStorage) {
    setToken(loginKey, loginToken);
    history.replace({ search: null });
  }

  const errorHandling = (error, scope = SCOPES.CALENDAR_RW) => {
    if (error.response.data.code === 400 || error.response.data.code === 401) {
      const scopeKey = error.response.data.message.scopeKey;
      let loginUrl = error.response.data.message.loginUrl;
      if (scopeKey) {
        //update with required scope here
        loginUrl = updateQueryStringParameter(loginUrl, scopeKey, scope);
      }
      if (loginUrl) {
        setUserLoggedIn(0);
        setLoginUrl(loginUrl);
      } else {
        //silent fail
        console.log("TheCodeMesh integration failed, trace : ", error.response.data.message.trace);
      }
    }
  };

  const fetchCalendars = () => {
    const scope = SCOPES.CALENDAR_RW;
    const url = `${TRIGGER_URL}${process.env.REACT_APP_PROJECT_ID}/${APIS.CALENDAR_LIST}/?redirect_url=${window.location.origin}`;
    axios
      .get(url, {
        headers: theCodeMeshTokens
      })
      .then(response => {
        setCalendars(response.data.items);
        localStorage.setItem("calendars", JSON.stringify(response.data.items));
      })
      .catch(error => {
        //handle generic errors
        errorHandling(error);
      });
  };

  const fetchEvents = items => {
    items.forEach(item => {
      let url = `${TRIGGER_URL}${process.env.REACT_APP_PROJECT_ID}/${APIS.EVENTS_LIST.replace("<calendarId>", encodeURIComponent(item.id))}/?redirect_url=${window.location.origin}`;
      setLoading(true);
      axios
        .get(url, { headers: theCodeMeshTokens })
        .then(res => {
          let localdata = eventsData;
          localdata.push(res.data);
          setEventsData(JSON.parse(JSON.stringify(eventsData)));
        })
        .catch(err => {
          console.log(err.response);
        })
        .finally(last => {
          setLoading(false);
        });
    });
  };

  useEffect(() => {
    // get code mesh token from the local storage
    const token = getToken();
    if (token) {
      // storeToken for local usage
      setTheCodeMeshTokens(token);
      // setting user logged in as true
      setUserLoggedIn(1);
      // Check for calendarIds
      let localCalendars = localStorage.getItem("calendars");
      if (localCalendars) setCalendars(JSON.parse(localCalendars));
    } else {
      fetchCalendars();
    }
  }, []);

  useEffect(() => {
    if (calendars && !eventsData.length) {
      fetchEvents(calendars);
    }
  }, [calendars]);

  useEffect(() => {
    if (theCodeMeshTokens && !calendars) {
      fetchCalendars();
    }
  }, [theCodeMeshTokens, calendars]);

  return (
    <React.Fragment>
      {loading ? (
        <div style={{margin: "0 auto"}}><ReactLoading type={"spin"} color={"blue"} height={"20px"} width={"20px"} /></div>
      ) : userLoggedIn === 0 ? (
        <div>
          Please login with your Google account, <a href={loginUrl}> Click here </a>
        </div>
      ) : (
        <div>
          <FullCalendar weekends={true} plugins={[dayGridPlugin, timeGridPlugin]} initialView="dayGridMonth" events={getEvents()} />
        </div>
      )}
    </React.Fragment>
  );
};
export default Home;
