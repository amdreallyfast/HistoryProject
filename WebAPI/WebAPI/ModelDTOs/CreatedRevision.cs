namespace WebAPI.ModelDTOs
{
    // What Create returns: the identity the server assigned to the new revision, not the whole
    // event. Echoing the event used to send the image back (several MB) although the client
    // already has it; EditEvent re-fetches GetAllRevisions as the source of truth anyway.
    public record CreatedRevision(Guid Id, Guid EventId, int Revision, DateTime RevisionDateTime);
}
