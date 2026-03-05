import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Nat64 "mo:core/Nat64";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Migration "migration";

(with migration = Migration.run)
actor {
  // Script Types and Logic
  type ScriptId = Nat64;
  var nextScriptId = 0;

  type Script = {
    id : ScriptId;
    title : Text;
    content : Text;
    category : ?Text;
    createdAt : Nat64;
    updatedAt : Nat64;
  };

  type ScriptInput = {
    title : Text;
    content : Text;
    category : ?Text;
  };

  module Script {
    public func compareByUpdatedAt(script1 : Script, script2 : Script) : Order.Order {
      Nat64.compare(script2.updatedAt, script1.updatedAt);
    };

    public func compareByTitle(script1 : Script, script2 : Script) : Order.Order {
      Text.compare(script1.title, script2.title);
    };
  };

  let scripts = Map.empty<ScriptId, Script>();

  func generateScriptId() : ScriptId {
    let id = Nat64.fromNat(nextScriptId);
    nextScriptId += 1;
    id;
  };

  public shared ({ caller }) func addScript(input : ScriptInput) : async ScriptId {
    let id = generateScriptId();
    let timestamp = Nat64.fromIntWrap(Time.now());
    let newScript : Script = {
      id;
      title = input.title;
      content = input.content;
      category = input.category;
      createdAt = timestamp;
      updatedAt = timestamp;
    };

    scripts.add(id, newScript);
    id;
  };

  public query ({ caller }) func getScripts() : async [Script] {
    scripts.values().toArray().sort(Script.compareByUpdatedAt);
  };

  public query ({ caller }) func getScriptsByTitle() : async [Script] {
    scripts.values().toArray().sort(Script.compareByTitle);
  };

  public query ({ caller }) func getScriptsByCategory(category : Text) : async [Script] {
    scripts.values().toArray().filter(
      func(script) {
        switch (script.category) {
          case (null) { false };
          case (?cat) { cat == category };
        };
      }
    ).sort(Script.compareByTitle);
  };

  public shared ({ caller }) func updateScript(id : ScriptId, input : ScriptInput) : async () {
    switch (scripts.get(id)) {
      case (null) { Runtime.trap("Script does not exist") };
      case (?existingScript) {
        let updatedScript : Script = {
          id;
          title = input.title;
          content = input.content;
          category = input.category;
          createdAt = existingScript.createdAt;
          updatedAt = Nat64.fromIntWrap(Time.now());
        };
        scripts.add(id, updatedScript);
      };
    };
  };

  public shared ({ caller }) func deleteScript(id : ScriptId) : async () {
    switch (scripts.get(id)) {
      case (null) { Runtime.trap("Script does not exist") };
      case (?_) {
        scripts.remove(id);
      };
    };
  };

  public query ({ caller }) func getScript(id : ScriptId) : async Script {
    switch (scripts.get(id)) {
      case (null) { Runtime.trap("Script does not exist") };
      case (?script) { script };
    };
  };

  // Potential Clients Types and Logic
  type GroupId = Nat64;
  type ClientId = Nat64;

  var nextGroupId = 0;
  var nextClientId = 0;

  type ClientGroup = {
    id : GroupId;
    name : Text;
    description : ?Text;
    createdAt : Nat64;
  };

  type ClientGroupInput = {
    name : Text;
    description : ?Text;
  };

  module ClientGroup {
    public func compareByName(group1 : ClientGroup, group2 : ClientGroup) : Order.Order {
      Text.compare(group1.name, group2.name);
    };
  };

  let clientGroups = Map.empty<GroupId, ClientGroup>();

  func generateGroupId() : GroupId {
    let id = Nat64.fromNat(nextGroupId);
    nextGroupId += 1;
    id;
  };

  type Client = {
    id : ClientId;
    groupId : GroupId;
    name : Text;
    company : ?Text;
    phone : ?Text;
    email : ?Text;
    notes : ?Text;
    createdAt : Nat64;
  };

  type ClientInput = {
    groupId : GroupId;
    name : Text;
    company : ?Text;
    phone : ?Text;
    email : ?Text;
    notes : ?Text;
  };

  module Client {
    public func compareByName(client1 : Client, client2 : Client) : Order.Order {
      Text.compare(client1.name, client2.name);
    };
  };

  let clients = Map.empty<ClientId, Client>();

  func generateClientId() : ClientId {
    let id = Nat64.fromNat(nextClientId);
    nextClientId += 1;
    id;
  };

  // Client Group Operations
  public shared ({ caller }) func addClientGroup(input : ClientGroupInput) : async GroupId {
    let id = generateGroupId();
    let timestamp = Nat64.fromIntWrap(Time.now());
    let newGroup : ClientGroup = {
      id;
      name = input.name;
      description = input.description;
      createdAt = timestamp;
    };

    clientGroups.add(id, newGroup);
    id;
  };

  public query ({ caller }) func getClientGroups() : async [ClientGroup] {
    clientGroups.values().toArray().sort(ClientGroup.compareByName);
  };

  public shared ({ caller }) func updateClientGroup(id : GroupId, input : ClientGroupInput) : async () {
    switch (clientGroups.get(id)) {
      case (null) { Runtime.trap("Group does not exist") };
      case (?existingGroup) {
        let updatedGroup : ClientGroup = {
          id;
          name = input.name;
          description = input.description;
          createdAt = existingGroup.createdAt;
        };
        clientGroups.add(id, updatedGroup);
      };
    };
  };

  public shared ({ caller }) func deleteClientGroup(id : GroupId) : async () {
    if (not clientGroups.containsKey(id)) { Runtime.trap("Group does not exist") };
    clientGroups.remove(id);

    // Remove associated clients
    let toRemove = clients.toArray().filter(
      func((_, client)) {
        client.groupId == id;
      }
    );
    for ((clientId, _) in toRemove.values()) {
      clients.remove(clientId);
    };
  };

  // Client Operations
  public shared ({ caller }) func addClient(input : ClientInput) : async ClientId {
    if (not clientGroups.containsKey(input.groupId)) { Runtime.trap("Group does not exist") };
    let id = generateClientId();
    let timestamp = Nat64.fromIntWrap(Time.now());
    let newClient : Client = {
      id;
      groupId = input.groupId;
      name = input.name;
      company = input.company;
      phone = input.phone;
      email = input.email;
      notes = input.notes;
      createdAt = timestamp;
    };

    clients.add(id, newClient);
    id;
  };

  public query ({ caller }) func getClients() : async [Client] {
    clients.values().toArray();
  };

  public query ({ caller }) func getClientsByGroup(groupId : GroupId) : async [Client] {
    if (not clientGroups.containsKey(groupId)) { Runtime.trap("Group does not exist") };
    clients.values().toArray().filter(
      func(client) {
        client.groupId == groupId;
      }
    );
  };

  public shared ({ caller }) func updateClient(id : ClientId, input : ClientInput) : async () {
    switch (clients.get(id)) {
      case (null) { Runtime.trap("Client does not exist") };
      case (?existingClient) {
        if (not clientGroups.containsKey(input.groupId)) { Runtime.trap("Group does not exist") };
        let updatedClient : Client = {
          id;
          groupId = input.groupId;
          name = input.name;
          company = input.company;
          phone = input.phone;
          email = input.email;
          notes = input.notes;
          createdAt = existingClient.createdAt;
        };
        clients.add(id, updatedClient);
      };
    };
  };

  public shared ({ caller }) func deleteClient(id : ClientId) : async () {
    switch (clients.get(id)) {
      case (null) { Runtime.trap("Client does not exist") };
      case (?_) {
        clients.remove(id);
      };
    };
  };
};
